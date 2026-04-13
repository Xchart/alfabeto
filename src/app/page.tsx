"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VersionLabel from "./components/VersionLabel";

const APPS = [
  {
    id: "letras",
    icon: "A",
    label: "Letras",
    href: "/letras",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.12)",
    available: true,
  },
  {
    id: "numeros",
    icon: "123",
    label: "Números",
    href: "/numeros",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.12)",
    available: true,
  },
];

export default function Home() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
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

  return (
    <main className="homeContainer">
      <VersionLabel />
      <div className="homeContent">
        <h1 className="homeTitle">Chispa</h1>
        <p className="homeSubtitle">¿Qué quieres aprender?</p>
        <div className="appsGrid">
          {APPS.map((app) => (
            <Link
              key={app.id}
              href={app.available ? app.href : "#"}
              className={`appCard ${!app.available ? "is-locked" : ""}`}
              style={{
                borderColor: app.color,
                background: app.bgColor,
              }}
              onClick={() => speak(app.label)}
            >
              <span
                className="appIcon"
                style={{ color: app.color }}
              >
                {app.icon}
              </span>
              <span className="appLabel">{app.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
