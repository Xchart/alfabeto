/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import VersionLabel from "../components/VersionLabel";
import { captureEvent } from "../lib/analytics";
import { markCompleted } from "../lib/progress";

type TraceActivity = {
  id: string;
  title: string;
  icon: string;
  instruction: string;
  path: string;
  viewBox: string;
  color: string;
};

type Point = { x: number; y: number };

const ACTIVITIES: TraceActivity[] = [
  {
    id: "ola",
    title: "Sigue la ola",
    icon: "🌊",
    instruction: "Traza la curva despacito, sin levantar mucho el dedo.",
    path: "M8 55 C 25 25, 42 25, 58 55 S 92 85, 110 55",
    viewBox: "0 0 118 110",
    color: "#3b82f6",
  },
  {
    id: "montana",
    title: "Sube la montaña",
    icon: "⛰️",
    instruction: "Sube y baja con líneas inclinadas, con calma.",
    path: "M10 82 L34 34 L58 82 L82 34 L108 82",
    viewBox: "0 0 118 110",
    color: "#8b5cf6",
  },
  {
    id: "circulo",
    title: "Dibuja el círculo",
    icon: "🫧",
    instruction: "Da la vuelta completa y vuelve al inicio.",
    path: "M59 18 C84 18, 102 36, 102 55 C102 78, 83 94, 59 94 C35 94, 16 78, 16 55 C16 36, 34 18, 59 18",
    viewBox: "0 0 118 110",
    color: "#10b981",
  },
  {
    id: "zigzag",
    title: "Camino zigzag",
    icon: "⚡",
    instruction: "Cambia de dirección sin correr.",
    path: "M12 26 L42 82 L62 26 L84 82 L108 26",
    viewBox: "0 0 118 110",
    color: "#f59e0b",
  },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export default function TrazosPage() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"guia" | "libre">("guia");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawDistance, setDrawDistance] = useState(0);
  const [coverageProgress, setCoverageProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const guideSamplesRef = useRef<Point[]>([]);
  const coveredSamplesRef = useRef<Set<number>>(new Set());

  const activity = ACTIVITIES[index];
  const distanceProgress = Math.min(100, Math.round((drawDistance / 520) * 100));
  const progress = mode === "guia" ? coverageProgress : distanceProgress;
  const isComplete = mode === "guia" ? progress >= 70 : progress >= 65;

  useEffect(() => {
    captureEvent("app_opened", { app: "trazos" });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(8, Math.round(rect.width / 32));
    ctx.strokeStyle = "#2e2452";

    const [viewX, viewY, viewW, viewH] = activity.viewBox.split(" ").map(Number);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", activity.path);
    const totalLength = path.getTotalLength();
    const padding = 18;
    const usableWidth = rect.width - padding * 2;
    const usableHeight = rect.height - padding * 2;
    const sampleCount = 90;

    guideSamplesRef.current = Array.from({ length: sampleCount }, (_, sampleIndex) => {
      const point = path.getPointAtLength((totalLength * sampleIndex) / (sampleCount - 1));
      return {
        x: padding + ((point.x - viewX) / viewW) * usableWidth,
        y: padding + ((point.y - viewY) / viewH) * usableHeight,
      };
    });
    coveredSamplesRef.current = new Set();
    setCoverageProgress(0);
  }, [activity.path, activity.viewBox, index]);

  const resetTraceProgress = () => {
    setDrawDistance(0);
    setCoverageProgress(0);
    coveredSamplesRef.current = new Set();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resetTraceProgress();
    captureEvent("canvas_cleared", { screen: "trazos", activity: activity.id });
  };

  const getPoint = (event: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const source = "touches" in event ? event.touches[0] : event;
    return { x: source.clientX - rect.left, y: source.clientY - rect.top };
  };

  const updateGuideCoverage = (point: Point) => {
    if (mode !== "guia") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tolerance = Math.max(20, rect.width / 16);
    let changed = false;

    guideSamplesRef.current.forEach((sample, sampleIndex) => {
      if (coveredSamplesRef.current.has(sampleIndex)) return;
      const distance = Math.hypot(point.x - sample.x, point.y - sample.y);
      if (distance <= tolerance) {
        coveredSamplesRef.current.add(sampleIndex);
        changed = true;
      }
    });

    if (changed && guideSamplesRef.current.length > 0) {
      setCoverageProgress(Math.round((coveredSamplesRef.current.size / guideSamplesRef.current.length) * 100));
    }
  };

  const startDrawing = (event: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setIsDrawing(true);
    lastPointRef.current = getPoint(event);
  };

  const draw = (event: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    event.preventDefault();
    const point = getPoint(event);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const distance = Math.hypot(point.x - lastPointRef.current.x, point.y - lastPointRef.current.y);
    const midPoint = {
      x: (point.x + lastPointRef.current.x) / 2,
      y: (point.y + lastPointRef.current.y) / 2,
    };
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    setDrawDistance((value) => value + distance);
    updateGuideCoverage(midPoint);
    updateGuideCoverage(point);
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  useEffect(() => {
    if (!isComplete) return;
    markCompleted("traces", activity.id);
    captureEvent("graphomotor_trace_completed", { activity: activity.id });
  }, [isComplete, activity.id]);

  const next = () => {
    setIndex((value) => (value + 1) % ACTIVITIES.length);
    resetTraceProgress();
    captureEvent("navigation_clicked", { screen: "trazos", direction: "next" });
  };

  const prev = () => {
    setIndex((value) => (value - 1 + ACTIVITIES.length) % ACTIVITIES.length);
    resetTraceProgress();
    captureEvent("navigation_clicked", { screen: "trazos", direction: "prev" });
  };

  const feedback = useMemo(() => {
    if (mode === "guia" && progress >= 80) return "Muy bien. Cubriste casi todo el camino con control.";
    if (mode === "guia" && progress >= 40) return "Vas bien. Sigue sobre la guía, despacito y sin correr.";
    if (mode === "libre" && progress >= 80) return "Muy bien. Tu trazo ya se ve más continuo.";
    if (mode === "libre" && progress >= 40) return "Vas bien. Sigue con calma y trata de completar el movimiento.";
    return "Empieza despacito. Lo importante es mover la mano con control.";
  }, [mode, progress]);

  return (
    <main className="mainContainer">
      <VersionLabel />
      <Link href="/" className="homeBtn" aria-label="Inicio">🏠</Link>
      <div className="container trazosContainer">
        <div className="header">
          <button type="button" className="navBtn prevBtn" onClick={prev}>◀</button>
          <div className="letterDisplay">
            <span className="letterIndex">{activity.icon} {index + 1}/{ACTIVITIES.length}</span>
          </div>
          <button type="button" className="navBtn nextBtn" onClick={next}>▶</button>
        </div>

        <section className="traceHeroCard">
          <p className="eyebrow">Grafomotricidad</p>
          <h1>{activity.title}</h1>
          <p>{activity.instruction}</p>
          <button type="button" className="traceListenBtn" onClick={() => speak(activity.instruction)}>
            🔊 Escuchar
          </button>
        </section>

        <div className="traceModeToggle" role="group" aria-label="Modo de práctica">
          <button type="button" className={`traceModeBtn ${mode === "guia" ? "is-active" : ""}`} onClick={() => setMode("guia")}>Guía</button>
          <button type="button" className={`traceModeBtn ${mode === "libre" ? "is-active" : ""}`} onClick={() => setMode("libre")}>Libre</button>
        </div>

        <section className="graphCanvasCard">
          {mode === "guia" && (
            <svg className="graphGuide" viewBox={activity.viewBox} aria-hidden="true" preserveAspectRatio="none">
              <path d={activity.path} fill="none" stroke={activity.color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />
              <path d={activity.path} fill="none" stroke={activity.color} strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" opacity="0.5" />
            </svg>
          )}
          <canvas
            ref={canvasRef}
            className="graphCanvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <button type="button" className="canvasClearBtn" onClick={clearCanvas} aria-label="Borrar">↺</button>
        </section>

        <section className="traceFeedbackCard">
          <div className="progressTrack">
            <div className="progressFill" style={{ width: `${progress}%`, background: activity.color }} />
          </div>
          <p>{feedback}</p>
          {isComplete && <strong className="traceCompleteBadge">⭐ Trazo completado</strong>}
        </section>
      </div>
    </main>
  );
}
