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

const initialSpeechError = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return "Tu navegador no soporta audio de voz.";
  }
  return null;
};

export default function Home() {
  const [index, setIndex] = useState(0);
  const [speechError, setSpeechError] = useState<string | null>(initialSpeechError);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const supportsSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  const supportsFullscreen = typeof document !== "undefined" &&
    !!(document.fullscreenEnabled || (document as Document & WebkitDoc).webkitFullscreenEnabled);

  const startXRef = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!supportsSpeech) {
      return;
    }

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
  }, [supportsSpeech]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler as EventListener);
    };
  }, []);

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
    if (!supportsSpeech) {
      setSpeechError("Tu navegador no soporta audio de voz.");
      return;
    }

    if (isSpeaking) {
      return;
    }

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
    if (!supportsFullscreen || !carouselRef.current) {
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

  const visibleOffsets = [-1, 0, 1];

  return (
    <main className="screen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <section className="card" aria-live="polite">
        <header className="cardHeader">
          <p className="indexLabel">
            Letra {index + 1} de {SPANISH_ALPHABET.length}
          </p>
          {supportsFullscreen && (
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
          {visibleOffsets.map((offset) => {
            const entry = SPANISH_ALPHABET[wrapIndex(index + offset)];
            const positionClass =
              offset === 0 ? "is-active" : offset < 0 ? "is-prev" : "is-next";

            return (
              <button
                key={`${entry.letter}-${positionClass}`}
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
