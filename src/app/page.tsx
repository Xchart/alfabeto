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

  const supportsSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  const startXRef = useRef<number | null>(null);

  const currentLetter = SPANISH_ALPHABET[index];
  const canGoBack = index > 0;
  const canGoForward = index < SPANISH_ALPHABET.length - 1;

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

  const goPrevious = () => {
    setIndex((current) => Math.max(current - 1, 0));
  };

  const goNext = () => {
    setIndex((current) => Math.min(current + 1, SPANISH_ALPHABET.length - 1));
  };

  const handleSpeak = () => {
    if (!supportsSpeech) {
      setSpeechError("Tu navegador no soporta audio de voz.");
      return;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(currentLetter.letter);
    utterance.lang = latinAmericanVoice?.lang ?? "es-MX";
    utterance.rate = 0.8;
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

  const speakDisabled = !supportsSpeech || voices.length === 0 || isSpeaking;

  return (
    <main className="screen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <section className="card" aria-live="polite">
        <p className="indexLabel">
          Letra {index + 1} de {SPANISH_ALPHABET.length}
        </p>
        <div key={currentLetter.letter} className="letterSwap animate">
          <h1 className="letter">{currentLetter.letter}</h1>
          <p className="phonetic">{currentLetter.phonetic}</p>
        </div>

        <div className="controls" role="group" aria-label="Controles del alfabeto">
          <button type="button" className="button secondary" onClick={goPrevious} disabled={!canGoBack}>
            Anterior
          </button>
          <button type="button" className="button speak" onClick={handleSpeak} disabled={speakDisabled}>
            {isSpeaking ? "Escuchando..." : "Escuchar"}
          </button>
          <button type="button" className="button primary" onClick={goNext} disabled={!canGoForward}>
            Siguiente
          </button>
        </div>

        {speechError ? (
          <p className="hint">{speechError}</p>
        ) : (
          <p className="hint">Desliza a izquierda o derecha para cambiar de letra.</p>
        )}
      </section>
    </main>
  );
}
