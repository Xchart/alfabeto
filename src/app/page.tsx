"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VersionLabel from "./components/VersionLabel";
import { hasSeenDemo, runHomeDemo } from "./lib/demoTour";
import { captureEvent } from "./lib/analytics";
import { PROGRESS_UPDATED_EVENT, getDailyChallenge, getProgress, progressPct, type ChispaProgress } from "./lib/progress";

const TOTAL_LETTERS = 27;
const TOTAL_NUMBERS = 10;
const TOTAL_TRACES = 10;

const APPS = [
  {
    id: "trazos",
    icon: "〰️",
    label: "Trazos",
    subtitle: "Grafomotricidad",
    href: "/trazos",
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.14)",
    available: true,
  },
  {
    id: "letras",
    icon: "A",
    label: "Letras",
    subtitle: "A-Z + Ñ",
    href: "/letras",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.12)",
    available: true,
  },
  {
    id: "numeros",
    icon: "123",
    label: "Números",
    subtitle: "0-9",
    href: "/numeros",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.12)",
    available: true,
  },
];

export default function Home() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState<ChispaProgress>(() => getProgress());

  const challenge = useMemo(() => getDailyChallenge(), []);

  const refreshProgress = useCallback(() => {
    setProgress(getProgress());
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshProgress();
    };

    window.addEventListener("focus", refreshProgress);
    window.addEventListener("pageshow", refreshProgress);
    window.addEventListener("storage", refreshProgress);
    window.addEventListener(PROGRESS_UPDATED_EVENT, refreshProgress);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshProgress);
      window.removeEventListener("pageshow", refreshProgress);
      window.removeEventListener("storage", refreshProgress);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refreshProgress);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshProgress]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    captureEvent("home_view");
    const timer = window.setTimeout(() => {
      if (!hasSeenDemo()) {
        captureEvent("demo_auto_started", { screen: "home" });
        runHomeDemo();
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 0.9;
    const spanishVoice = voices.find((v) => v.lang.startsWith("es"));
    if (spanishVoice) utterance.voice = spanishVoice;
    synth.speak(utterance);
  };

  const stats = [
    {
      label: "Trazos",
      value: progressPct(progress.tracesCompleted.length, TOTAL_TRACES),
      caption: `${progress.tracesCompleted.length}/${TOTAL_TRACES}`,
      color: "#8b5cf6",
    },
    {
      label: "Letras",
      value: progressPct(progress.lettersCompleted.length, TOTAL_LETTERS),
      caption: `${progress.lettersCompleted.length}/${TOTAL_LETTERS}`,
      color: "#3b82f6",
    },
    {
      label: "Números",
      value: progressPct(progress.numbersCompleted.length, TOTAL_NUMBERS),
      caption: `${progress.numbersCompleted.length}/${TOTAL_NUMBERS}`,
      color: "#10b981",
    },
  ];

  return (
    <main className="homeContainer homeProductContainer">
      <VersionLabel />
      <div className="homeProductContent">
        <section className="heroCard" data-demo="title">
          <div>
            <p className="eyebrow">Preescritura y grafomotricidad</p>
            <h1 className="homeTitle">Chispa</h1>
            <p className="homeSubtitle">Practica trazos, letras y números con calma, juego y progreso.</p>
          </div>
          <button
            type="button"
            className="demoReplayBtn"
            data-demo="demo-button"
            onClick={() => {
              captureEvent("demo_replayed", { screen: "home" });
              runHomeDemo();
            }}
            aria-label="Volver a ejecutar demo"
          >
            ✨ Demo
          </button>
        </section>

        <section className="progressSummary" aria-label="Progreso">
          <div className="miniStat">
            <span className="miniStatIcon">🔥</span>
            <span className="miniStatValue">{progress.streakDays}</span>
            <span className="miniStatLabel">racha</span>
          </div>
          <div className="miniStat">
            <span className="miniStatIcon">⭐</span>
            <span className="miniStatValue">{progress.stars}</span>
            <span className="miniStatLabel">estrellas</span>
          </div>
          <div className="challengeCard">
            <span className="challengeIcon">{challenge.icon}</span>
            <div>
              <span className="challengeLabel">Reto del día</span>
              <strong>{challenge.title}</strong>
              <p>{challenge.description}</p>
            </div>
          </div>
        </section>

        <section className="progressCards" aria-label="Avance por módulo">
          {stats.map((item) => (
            <article key={item.label} className="progressCard">
              <div className="progressCardHeader">
                <span>{item.label}</span>
                <strong>{item.caption}</strong>
              </div>
              <div className="progressTrack" aria-hidden="true">
                <div className="progressFill" style={{ width: `${item.value}%`, background: item.color }} />
              </div>
            </article>
          ))}
        </section>

        <section className="appsGrid productAppsGrid" aria-label="Aplicaciones">
          {APPS.map((app) => (
            <Link
              key={app.id}
              href={app.available ? app.href : "#"}
              data-demo={app.id}
              className={`appCard productAppCard ${!app.available ? "is-locked" : ""}`}
              style={{
                borderColor: app.color,
                background: app.bgColor,
              }}
              onClick={() => {
                captureEvent("app_opened", { app: app.id });
                speak(app.label);
              }}
            >
              <span className="appIcon" style={{ color: app.color }}>{app.icon}</span>
              <span className="appLabel">{app.label}</span>
              <span className="appSubtitle">{app.subtitle}</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
