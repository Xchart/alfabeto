/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";

type LetterEntry = {
  letter: string;
  phonetic: string;
};

const SPANISH_ALPHABET: LetterEntry[] = [
  { letter: "A", phonetic: "ah" },
  { letter: "B", phonetic: "be" },
  { letter: "C", phonetic: "ce" },
  { letter: "D", phonetic: "de" },
  { letter: "E", phonetic: "eh" },
  { letter: "F", phonetic: "efe" },
  { letter: "G", phonetic: "ge" },
  { letter: "H", phonetic: "hache" },
  { letter: "I", phonetic: "ee" },
  { letter: "J", phonetic: "jota" },
  { letter: "K", phonetic: "ka" },
  { letter: "L", phonetic: "ele" },
  { letter: "M", phonetic: "eme" },
  { letter: "N", phonetic: "ene" },
  { letter: "Ñ", phonetic: "eñe" },
  { letter: "O", phonetic: "oh" },
  { letter: "P", phonetic: "pe" },
  { letter: "Q", phonetic: "cu" },
  { letter: "R", phonetic: "erre" },
  { letter: "S", phonetic: "ese" },
  { letter: "T", phonetic: "te" },
  { letter: "U", phonetic: "oo" },
  { letter: "V", phonetic: "uve" },
  { letter: "W", phonetic: "uve doble" },
  { letter: "X", phonetic: "equis" },
  { letter: "Y", phonetic: "ye" },
  { letter: "Z", phonetic: "zeta" },
];

const MIN_SWIPE_DISTANCE = 40;

export default function Home() {
  const [index, setIndex] = useState(0);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canUseFullscreen, setCanUseFullscreen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const startXRef = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const ambientSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const supported = "speechSynthesis" in window;

    if (!supported) {
      setSpeechSupported(false);
      setSpeechError("Tu navegador no soporta audio de voz.");
      return;
    }

    setSpeechSupported(true);

    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      setSpeechError(null);
    };

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const enabled = Boolean(
      document.fullscreenEnabled ||
        (document as Document & WebkitDoc).webkitFullscreenEnabled,
    );

    setCanUseFullscreen(enabled);
  }, []);

  useEffect(() => {
    if (!canUseFullscreen || typeof document === "undefined") {
      return;
    }

    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler as EventListener);
    };
  }, [canUseFullscreen]);

  const latinAmericanVoice = useMemo(() => {
    const preferences = ["es-MX", "es-419", "es-US", "es-AR", "es-CO", "es-CL", "es-PE"];

    for (const locale of preferences) {
      const match = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase());
      if (match) {
        return match;
      }
    }

    return voices.find((voice) => voice.lang.toLowerCase().startsWith("es")) ?? null;
  }, [voices]);

  const wrapIndex = (target: number) => {
    const length = SPANISH_ALPHABET.length;
    return (target + length) % length;
  };

  const goPrevious = () => {
    setIndex((current) => wrapIndex(current - 1));
  };

  const goNext = () => {
    setIndex((current) => wrapIndex(current + 1));
  };

  const handleSpeak = (entry: LetterEntry) => {
    if (!speechSupported || typeof window === "undefined") {
      setSpeechError("Tu navegador no soporta audio de voz.");
      return;
    }

    if (isSpeaking) {
      return;
    }

    ambientSoundRef.current?.play().catch(() => {});

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(entry.letter);
    utterance.lang = latinAmericanVoice?.lang ?? "es-MX";
    utterance.rate = 0.85;
    utterance.pitch = 1.05;

    if (latinAmericanVoice) {
      utterance.voice = latinAmericanVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeechError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechError("No se pudo reproducir la pronunciación.");
    };

    synth.cancel();
    synth.speak(utterance);
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    startXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (startXRef.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;

    if (typeof endX !== "number") {
      startXRef.current = null;
      return;
    }

    const deltaX = endX - startXRef.current;
    startXRef.current = null;

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) {
      return;
    }

    if (deltaX < 0) {
      goNext();
      return;
    }

    goPrevious();
  };

  const toggleFullscreen = () => {
    if (!canUseFullscreen || !carouselRef.current || typeof document === "undefined") {
      return;
    }

    const el = carouselRef.current;

    if (!document.fullscreenElement && !(document as Document & WebkitDoc).webkitFullscreenElement) {
      const request = el.requestFullscreen || (el as HTMLElement & WebkitEl).webkitRequestFullscreen;
      request?.call(el);
      return;
    }

    const exit = document.exitFullscreen || (document as Document & WebkitDoc).webkitExitFullscreen;
    exit?.call(document);
  };

  const offsets = [-1, 0, 1];

  return (
    <main className="screen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <section className="card" aria-live="polite">
        <header className="cardHeader">
          <p className="indexLabel">
            Letra {index + 1} de {SPANISH_ALPHABET.length}
          </p>
          {canUseFullscreen && (
            <button
              type="button"
              className={`fullscreenToggle ${isFullscreen ? "is-active" : ""}`}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
            >
              ⤢
            </button>
          )}
        </header>

        <div className="carousel" ref={carouselRef}>
          {offsets.map((offset) => {
            const entry = SPANISH_ALPHABET[wrapIndex(index + offset)];
            const positionClass = offset === 0 ? "is-active" : offset < 0 ? "is-prev" : "is-next";
            const key = `${entry.letter}-${offset === 0 ? index : wrapIndex(index + offset)}`;

            return (
              <button
                key={key}
                type="button"
                className={`letterCard ${positionClass}`}
                onClick={() => handleSpeak(entry)}
                aria-label={`Letra ${entry.letter}`}
              >
                <span className="letter">{entry.letter}</span>
                <span className="phonetic">{entry.phonetic}</span>
              </button>
            );
          })}
        </div>

        {speechError ? (
          <p className="hint">{speechError}</p>
        ) : (
          <p className="hint">Desliza para cambiar y toca la letra central para escucharla.</p>
        )}

        <audio ref={ambientSoundRef} src="/sounds/tap.wav" preload="auto" aria-hidden="true" />
      </section>
    </main>
  );
}

type WebkitDoc = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
};

type WebkitEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};
