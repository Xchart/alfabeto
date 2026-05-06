/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { TouchEvent, MouseEvent } from "react";
import { speakFeedback } from "../lib/letterValidator";
import { validateDigit, type DigitValidationResult } from "../lib/numberValidator";
import { analyzeStroke, generateCoachFeedback, type CoachFeedback } from "../lib/writingCoach";
import VersionLabel from "../components/VersionLabel";
import { runNumbersDemo } from "../lib/demoTour";
import { captureEvent } from "../lib/analytics";
import { markCompleted } from "../lib/progress";

type WebkitDoc = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;
};

type NumberEntry = {
  number: string;
  name: string;
};

const NUMBERS: NumberEntry[] = [
  { number: "0", name: "cero" },
  { number: "1", name: "uno" },
  { number: "2", name: "dos" },
  { number: "3", name: "tres" },
  { number: "4", name: "cuatro" },
  { number: "5", name: "cinco" },
  { number: "6", name: "seis" },
  { number: "7", name: "siete" },
  { number: "8", name: "ocho" },
  { number: "9", name: "nueve" },
];

const MIN_SWIPE_DISTANCE = 40;

// SVG stroke paths para números (orden de trazo educativo)
const NUMBER_STROKES: Record<string, string[]> = {
  "0": ["M 50 18 Q 28 18 28 55 Q 28 92 50 92 Q 72 92 72 55 Q 72 18 50 18"],
  "1": ["M 40 30 L 50 20 L 50 95"],
  "2": ["M 30 30 Q 30 18 50 18 Q 70 18 70 35 Q 70 50 30 95 L 70 95"],
  "3": ["M 30 25 Q 50 15 65 30 Q 75 42 50 55", "M 50 55 Q 75 65 65 82 Q 55 95 30 88"],
  "4": ["M 60 95 L 60 18", "M 60 18 L 25 65 L 75 65"],
  "5": ["M 65 18 L 30 18 L 28 52", "M 28 52 Q 50 42 65 55 Q 78 68 60 88 Q 45 98 28 88"],
  "6": ["M 62 22 Q 50 18 38 28 Q 25 42 25 60 Q 25 92 50 92 Q 72 92 72 72 Q 72 52 50 52 Q 28 52 25 60"],
  "7": ["M 28 18 L 72 18 L 42 95"],
  "8": ["M 50 55 Q 30 42 30 30 Q 30 18 50 18 Q 70 18 70 30 Q 70 42 50 55", "M 50 55 Q 28 68 28 80 Q 28 95 50 95 Q 72 95 72 80 Q 72 68 50 55"],
  "9": ["M 72 48 Q 72 18 50 18 Q 28 18 28 38 Q 28 55 50 55 Q 72 55 72 48 L 72 78 Q 68 95 45 95"],
};

// Componente para la animación del trazo SVG
function AnimatedNumberGuide({
  num,
  onTap,
  onSwipeLeft,
  onSwipeRight,
}: {
  num: string;
  onTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const strokes = NUMBER_STROKES[num] || ["M 0 0 L 100 100"];

  const runAnimation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setIsAnimating(true);
    const durationPerStroke = 800;
    const delayBetween = 200;

    pathRefs.current.forEach((path, i) => {
      if (!path) return;
      const length = path.getTotalLength();
      path.style.strokeDasharray = length.toString();
      path.style.strokeDashoffset = length.toString();
      path.style.transition = "none";
      const startDelay = i * (durationPerStroke + delayBetween);
      const t = setTimeout(() => {
        path.style.transition = `stroke-dashoffset ${durationPerStroke}ms ease-in-out`;
        path.style.strokeDashoffset = "0";
      }, startDelay);
      timeoutsRef.current.push(t);
    });

    const totalTime = strokes.length * (durationPerStroke + delayBetween);
    const tEnd = setTimeout(() => setIsAnimating(false), totalTime);
    timeoutsRef.current.push(tEnd);
  }, [strokes]);

  useEffect(() => {
    runAnimation();
    return () => { timeoutsRef.current.forEach(clearTimeout); };
  }, [num, replayKey, runAnimation]);

  const handleReplay = () => setReplayKey((k) => k + 1);

  return (
    <div
      className="animatedGuide"
      onClick={() => onTap?.()}
      onTouchStart={(e) => {
        (e.currentTarget as any)._swipeX = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const startX = (e.currentTarget as any)._swipeX;
        if (startX == null) return;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) onSwipeLeft?.();
          else onSwipeRight?.();
        }
        (e.currentTarget as any)._swipeX = null;
      }}
    >
      <svg viewBox="0 0 100 110" width="200" height="220">
        {strokes.map((d, i) => (
          <path key={`ghost-${num}-${i}`} d={d} stroke="#e0e0e0" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {strokes.map((d, i) => (
          <path
            key={`stroke-${num}-${i}-${replayKey}`}
            ref={(el) => { pathRefs.current[i] = el; }}
            d={d}
            stroke={i === 0 ? "#10b981" : "#f59e0b"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="guideControls">
        {isAnimating ? (
          <p className="animatingHint">Observa cómo se dibuja...</p>
        ) : (
          <button type="button" className="replayBtn" onClick={handleReplay}>
            🔄 Repetir
          </button>
        )}
      </div>
    </div>
  );
}

// Canvas de dibujo para números (reutiliza la misma lógica)
function NumberDrawingCanvas({
  num,
  voice,
}: {
  num: string;
  voice?: SpeechSynthesisVoice | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [traceMode, setTraceMode] = useState(true);
  const [liveScore, setLiveScore] = useState(0);
  const [result, setResult] = useState<DigitValidationResult | null>(null);
  const [coaching, setCoaching] = useState<CoachFeedback | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedNumberRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.strokeStyle = "#2e2452";
    ctx.lineWidth = Math.max(10, Math.round(displayWidth / 30));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setResult(null);
    setCoaching(null);
    setLiveScore(0);
    completedNumberRef.current = null;
  }, [num]);

  // Validación live con CNN
  const runLiveValidation = useCallback(() => {
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const validation = await validateDigit(canvas, num);
        setLiveScore(validation.score);
        setResult(validation);
      } catch {
        // silencioso en live
      }
    }, 300);
  }, [num]);

  const getPos = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
      const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }, [],
  );

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      runLiveValidation();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#2e2452";
    ctx.lineWidth = Math.max(10, Math.round(canvas.clientWidth / 30));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setResult(null);
    setCoaching(null);
    setLiveScore(0);
    completedNumberRef.current = null;
  };

  const handleVerify = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsValidating(true);

    if ("speechSynthesis" in window) {
      const warmup = new SpeechSynthesisUtterance("");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      window.speechSynthesis.cancel();
    }

    (async () => {
      try {
        const validation = await validateDigit(canvas, num);
        const analysis = analyzeStroke(canvas);
        const coachResult = generateCoachFeedback(num, validation.score, analysis);

        if (!validation.isCorrect) {
          coachResult.message = validation.feedback;
        }

        setResult(validation);
        setCoaching(coachResult);
        setLiveScore(validation.score);
        if (validation.isCorrect && validation.score >= 70 && completedNumberRef.current !== num) {
          completedNumberRef.current = num;
          markCompleted("numbers", num);
          captureEvent("practice_completed", { screen: "numbers", symbol: num, score: validation.score, source: "manual" });
        }
        setIsValidating(false);
        speakFeedback(`${coachResult.message} ${coachResult.encouragement}`, voice);
      } catch (err) {
        console.error("Digit validation error:", err);
        setIsValidating(false);
      }
    })();
  };

  useEffect(() => {
    if (!result?.isCorrect || liveScore < 70 || completedNumberRef.current === num) return;
    completedNumberRef.current = num;
    markCompleted("numbers", num);
    captureEvent("practice_completed", { screen: "numbers", symbol: num, score: liveScore, source: "live" });
  }, [num, liveScore, result]);

  const canvasStatusClass = isDrawing
    ? "is-drawing"
    : liveScore >= 70 ? "is-good"
    : liveScore >= 40 ? "is-mid"
    : liveScore > 0 ? "is-low"
    : "is-idle";

  return (
    <div className="drawingSection">
      <div className="topControls">
        <div className="traceModeToggle" role="group" data-demo="numbers-mode">
          <button type="button" className={`traceModeBtn ${traceMode ? "is-active" : ""}`} onClick={() => {
            captureEvent("mode_changed", { screen: "numbers", mode: "calca" });
            setTraceMode(true);
          }}>Calca</button>
          <button type="button" className={`traceModeBtn ${!traceMode ? "is-active" : ""}`} onClick={() => {
            captureEvent("mode_changed", { screen: "numbers", mode: "libre" });
            setTraceMode(false);
          }}>Libre</button>
        </div>
      </div>

      <div className={`canvasWrapper ${canvasStatusClass}`} data-demo="numbers-canvas">
        {traceMode && (
          <svg viewBox="0 0 100 110" className="traceWatermark" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            {(NUMBER_STROKES[num] || []).map((d, i) => (
              <path key={`wm-${num}-${i}`} d={d} stroke="#c7bce8" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        )}
        <canvas
          ref={canvasRef}
          className="drawingCanvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button type="button" onClick={() => {
          captureEvent("canvas_cleared", { screen: "numbers" });
          clearCanvas();
        }} className="canvasClearBtn" aria-label="Borrar" data-demo="numbers-clear">
          ↺
        </button>
        <button
          type="button"
          className={`canvasInfoBtn ${result && liveScore >= 70 && result.isCorrect ? "is-success" : result && liveScore > 0 ? "is-result" : ""}`}
          data-demo="numbers-hint"
          disabled={isValidating}
          onClick={() => {
            if (isValidating) return;
            captureEvent("hint_or_verify_clicked", {
              screen: "numbers",
              state: result && result.isCorrect && liveScore >= 70 ? "success" : result && liveScore > 0 ? "verify" : "hint",
            });
            if (result && result.isCorrect && liveScore >= 70) {
              const msg = coaching ? `${coaching.message} ${coaching.encouragement}` : `El número ${num} se ve muy bien.`;
              speakFeedback(msg, voice);
              return;
            }
            if (result && liveScore > 0) {
              handleVerify();
              return;
            }
            const intro = traceMode
              ? `Sigue la forma del número ${num} con tu dedo.`
              : `Dibuja el número ${num} con tu dedo.`;
            speakFeedback(intro, voice);
          }}
        >
          {isValidating ? "..." : result && result.isCorrect && liveScore >= 70 ? "⭐" : result && liveScore > 0 ? `${result.predictedDigit}?` : "💡"}
        </button>
      </div>
    </div>
  );
}

export default function NumerosPage() {
  const [index, setIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);

  const startXRef = useRef<number | null>(null);
  const entry = NUMBERS[index];

  const spanishVoice = useMemo(() =>
    voices.find(v => v.lang.startsWith("es")) || voices[0] || null
  , [voices]);

  // Pronunciar número al cambiar
  useEffect(() => {
    if (!speechSupported || !voices.length) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(entry.name);
    utterance.lang = "es-MX";
    utterance.rate = 0.9;
    if (spanishVoice) utterance.voice = spanishVoice;
    synth.speak(utterance);
  }, [index, voices, speechSupported]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "speechSynthesis" in window;
    if (!supported) { setSpeechSupported(false); return; }
    setSpeechSupported(true);
    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => { synth.removeEventListener("voiceschanged", loadVoices); synth.cancel(); };
  }, []);

  const playTapSound = () => {
    if (typeof window === "undefined") return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 700;
    osc.type = "sine";
    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  };

  const handlePrev = () => { playTapSound(); setIndex((i) => (i - 1 + NUMBERS.length) % NUMBERS.length); };
  const handleNext = () => { playTapSound(); setIndex((i) => (i + 1) % NUMBERS.length); };

  return (
    <main className="mainContainer">
      <VersionLabel />
      <Link href="/" className="homeBtn" aria-label="Inicio">🏠</Link>
      <div className="container">
        <div className="demoInlineRow">
          <button
            type="button"
            className="demoInlineBtn"
            data-demo="numbers-demo-button"
            onClick={() => {
              captureEvent("demo_replayed", { screen: "numbers" });
              runNumbersDemo();
            }}
            aria-label="Ver demo"
          >
            ✨ Ver demo
          </button>
        </div>
        <div
          className="header"
          onTouchStart={(e) => { startXRef.current = e.touches[0].clientX; }}
          onTouchEnd={() => { startXRef.current = null; }}
        >
          <button type="button" className="navBtn prevBtn" onClick={() => {
            captureEvent("navigation_clicked", { screen: "numbers", direction: "prev" });
            handlePrev();
          }} data-demo="numbers-prev">◀</button>
          <div className="letterDisplay" data-demo="numbers-symbol">
            <span className="letterIndex">
              {entry.number} — {index + 1}/{NUMBERS.length}
            </span>
          </div>
          <button type="button" className="navBtn nextBtn" onClick={() => {
            captureEvent("navigation_clicked", { screen: "numbers", direction: "next" });
            handleNext();
          }} data-demo="numbers-next">▶</button>
        </div>

        <div data-demo="numbers-animation">
        <AnimatedNumberGuide
          num={entry.number}
          onTap={() => {
            if (!speechSupported || !voices.length) return;
            const synth = window.speechSynthesis;
            synth.cancel();
            const u = new SpeechSynthesisUtterance(entry.name);
            u.lang = "es-MX";
            if (spanishVoice) u.voice = spanishVoice;
            synth.speak(u);
          }}
          onSwipeLeft={handleNext}
          onSwipeRight={handlePrev}
        />
        </div>

        <NumberDrawingCanvas num={entry.number} voice={spanishVoice} />
      </div>
    </main>
  );
}
