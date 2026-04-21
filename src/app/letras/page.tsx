/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { TouchEvent, MouseEvent } from "react";
import { validateLetter, speakFeedback, type ValidationResult } from "../lib/letterValidator";
import { analyzeStroke, generateCoachFeedback, type CoachFeedback } from "../lib/writingCoach";
import VersionLabel from "../components/VersionLabel";
import { runLettersDemo } from "../lib/demoTour";
import { captureEvent } from "../lib/analytics";

type WebkitDoc = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;
};

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

// SVG stroke paths con multi-trazo educativo.
// Cada letra tiene un array de trazos en el orden correcto de escritura.
// Regla general: arriba→abajo, izquierda→derecha, trazos verticales antes de horizontales.
const LETTER_STROKES: Record<string, string[]> = {
  // A: 1) diagonal izq abajo→arriba, 2) diagonal arriba→abajo derecha, 3) barra horizontal
  A: ["M 30 95 L 50 20", "M 50 20 L 70 95", "M 38 65 L 62 65"],
  // B: 1) trazo vertical abajo, 2) panza superior, 3) panza inferior
  B: ["M 30 20 L 30 95", "M 30 20 L 60 20 Q 72 20 72 35 Q 72 50 60 55 L 30 55", "M 30 55 L 63 55 Q 75 55 75 72 Q 75 90 63 95 L 30 95"],
  // C: arco abierto de arriba-derecha, baja y vuelve abajo-derecha
  C: ["M 70 30 Q 55 18 42 18 Q 25 18 25 55 Q 25 90 42 95 Q 55 95 70 82"],
  // D: 1) vertical abajo, 2) curva de arriba a abajo
  D: ["M 30 20 L 30 95", "M 30 20 L 55 20 Q 75 20 75 55 Q 75 90 55 95 L 30 95"],
  // E: 1) vertical abajo, 2) horizontal arriba, 3) horizontal medio, 4) horizontal abajo
  E: ["M 30 20 L 30 95", "M 30 20 L 70 20", "M 30 57 L 62 57", "M 30 95 L 70 95"],
  // F: 1) vertical abajo, 2) horizontal arriba, 3) horizontal medio
  F: ["M 30 20 L 30 95", "M 30 20 L 70 20", "M 30 57 L 62 57"],
  // G: 1) arco como C, 2) barra horizontal hacia adentro
  G: ["M 70 30 Q 55 18 42 18 Q 25 18 25 55 Q 25 90 42 95 Q 55 95 70 82 L 70 57", "M 55 57 L 70 57"],
  // H: 1) vertical izq, 2) vertical der, 3) barra horizontal
  H: ["M 30 20 L 30 95", "M 70 20 L 70 95", "M 30 57 L 70 57"],
  // I: 1) horizontal arriba, 2) vertical centro, 3) horizontal abajo
  I: ["M 35 20 L 65 20", "M 50 20 L 50 95", "M 35 95 L 65 95"],
  // J: 1) horizontal arriba (opcional), 2) vertical baja y curva izquierda
  J: ["M 40 20 L 70 20", "M 58 20 L 58 78 Q 58 95 42 95 Q 30 95 30 85"],
  // K: 1) vertical izq, 2) diagonal hacia arriba-derecha, 3) diagonal hacia abajo-derecha
  K: ["M 30 20 L 30 95", "M 68 20 L 30 57", "M 30 57 L 68 95"],
  // L: 1) vertical abajo, 2) horizontal derecha
  L: ["M 30 20 L 30 95", "M 30 95 L 70 95"],
  // M: 1) vertical izq, 2) diagonal hacia centro-abajo, 3) diagonal hacia arriba-derecha, 4) vertical der
  M: ["M 25 95 L 25 20", "M 25 20 L 50 60", "M 50 60 L 75 20", "M 75 20 L 75 95"],
  // N: 1) vertical izq, 2) diagonal hacia abajo-derecha, 3) vertical der sube
  N: ["M 30 95 L 30 20", "M 30 20 L 70 95", "M 70 95 L 70 20"],
  // Ñ: 1) tilde ondulada, 2-4) igual que N
  Ñ: ["M 38 12 Q 45 6 50 12 Q 55 18 62 12", "M 30 95 L 30 22", "M 30 22 L 70 95", "M 70 95 L 70 22"],
  // O: arco completo empezando arriba, sentido antihorario
  O: ["M 50 18 Q 28 18 28 55 Q 28 92 50 92 Q 72 92 72 55 Q 72 18 50 18"],
  // P: 1) vertical abajo, 2) panza superior
  P: ["M 30 20 L 30 95", "M 30 20 L 58 20 Q 72 20 72 38 Q 72 55 58 55 L 30 55"],
  // Q: 1) óvalo como O, 2) colita diagonal
  Q: ["M 50 18 Q 28 18 28 55 Q 28 92 50 92 Q 72 92 72 55 Q 72 18 50 18", "M 58 78 L 72 98"],
  // R: 1) vertical abajo, 2) panza superior, 3) pierna diagonal
  R: ["M 30 20 L 30 95", "M 30 20 L 58 20 Q 72 20 72 38 Q 72 55 58 55 L 30 55", "M 55 55 L 72 95"],
  // S: curva en S de arriba a abajo
  S: ["M 65 28 Q 65 18 50 18 Q 32 18 32 35 Q 32 50 50 55 Q 68 60 68 78 Q 68 95 50 95 Q 32 95 32 85"],
  // T: 1) horizontal arriba, 2) vertical centro abajo
  T: ["M 25 20 L 75 20", "M 50 20 L 50 95"],
  // U: un solo trazo en U
  U: ["M 30 20 L 30 75 Q 30 95 50 95 Q 70 95 70 75 L 70 20"],
  // V: un solo trazo en V
  V: ["M 28 20 L 50 95 L 72 20"],
  // W: un solo trazo en W
  W: ["M 22 20 L 36 95 L 50 50 L 64 95 L 78 20"],
  // X: 1) diagonal izq-arriba→der-abajo, 2) diagonal der-arriba→izq-abajo
  X: ["M 30 20 L 70 95", "M 70 20 L 30 95"],
  // Y: 1) diagonal izq-arriba→centro, 2) diagonal der-arriba→centro, 3) vertical centro-abajo
  Y: ["M 28 20 L 50 55", "M 72 20 L 50 55", "M 50 55 L 50 95"],
  // Z: un solo trazo en zigzag
  Z: ["M 28 20 L 72 20 L 28 95 L 72 95"],
};

// Componente para la animación del trazo SVG (multi-trazo secuencial)
function AnimatedLetterGuide({
  letter,
  onReplay,
  onTap,
  onSwipeLeft,
  onSwipeRight,
}: {
  letter: string;
  onReplay?: () => void;
  onTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const strokes = LETTER_STROKES[letter] || ["M 0 0 L 100 100"];

  const runAnimation = useCallback(() => {
    // Limpiar timeouts previos
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsAnimating(true);
    const durationPerStroke = 800; // ms por trazo
    const delayBetween = 200; // pausa entre trazos

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

    const totalTime =
      strokes.length * (durationPerStroke + delayBetween);
    const tEnd = setTimeout(() => setIsAnimating(false), totalTime);
    timeoutsRef.current.push(tEnd);
  }, [strokes]);

  useEffect(() => {
    runAnimation();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [letter, replayKey, runAnimation]);

  const handleReplay = () => {
    setReplayKey((k) => k + 1);
    onReplay?.();
  };

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
        {/* Letra fantasma de fondo como guía */}
        {strokes.map((d, i) => (
          <path
            key={`ghost-${letter}-${i}`}
            d={d}
            stroke="#e0e0e0"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Trazos animados con colores secuenciales */}
        {strokes.map((d, i) => (
          <path
            key={`stroke-${letter}-${i}-${replayKey}`}
            ref={(el) => { pathRefs.current[i] = el; }}
            d={d}
            stroke={i === 0 ? "#3b82f6" : i === 1 ? "#8b5cf6" : i === 2 ? "#ec4899" : "#f59e0b"}
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
            🔄 Repetir animación
          </button>
        )}
      </div>
    </div>
  );
}

// Componente para el lienzo interactivo con validación en tiempo real
function DrawingCanvas({
  letter,
  onComplete,
  voice,
}: {
  letter: string;
  onComplete: () => void;
  voice?: SpeechSynthesisVoice | null;
}) {
  const [traceMode, setTraceMode] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [coaching, setCoaching] = useState<CoachFeedback | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setShowFeedback(false);
  }, [letter]);

  // Validación en tiempo real (debounced)
  const runLiveValidation = useCallback(() => {
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const validation = await validateLetter(canvas, letter);
        setLiveScore(validation.score);
        setResult(validation);
      } catch {
        // silencioso en live
      }
    }, 300);
  }, [letter]);

  const getPos = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
      const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [],
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
      // Validar en tiempo real al soltar el dedo
      runLiveValidation();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
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
    setShowFeedback(false);
  };

  const dismissFeedback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setShowFeedback(false);
  };

  const handleVerify = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsValidating(true);

    // Warm up speechSynthesis sincrónicamente en el gesto del usuario
    // para que el navegador móvil permita hablar después del await
    if ("speechSynthesis" in window) {
      const warmup = new SpeechSynthesisUtterance("");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      window.speechSynthesis.cancel();
    }

    (async () => {
      try {
        const validation = await validateLetter(canvas, letter);
        const analysis = analyzeStroke(canvas);
        const coachResult = generateCoachFeedback(letter, validation.score, analysis);

        if (!validation.isCorrect) {
          coachResult.message = validation.feedback;
        }

        setResult(validation);
        setCoaching(coachResult);
        setLiveScore(validation.score);
        setIsValidating(false);
        setShowFeedback(true);

        const audioText = `${coachResult.message} ${coachResult.encouragement}`;
        speakFeedback(audioText, voice);
      } catch (err) {
        console.error("Validation error:", err);
        setIsValidating(false);
        const analysis = analyzeStroke(canvas);
        const fallbackScore = analysis.hasContent ? 50 : 0;
        const coachResult = generateCoachFeedback(letter, fallbackScore, analysis);
        const fallbackResult: ValidationResult = {
          score: fallbackScore,
          isCorrect: fallbackScore >= 50,
          predictedLetter: letter,
          confidence: 0,
          feedback: coachResult.message,
        };
        setResult(fallbackResult);
        setCoaching(coachResult);
        setShowFeedback(true);
        speakFeedback(`${coachResult.message} ${coachResult.encouragement}`, voice);
      }
    })();
  };

  const canvasStatusClass = isDrawing
    ? "is-drawing"
    : liveScore >= 70
      ? "is-good"
      : liveScore >= 40
        ? "is-mid"
        : liveScore > 0
          ? "is-low"
          : "is-idle";

  return (
    <div className="drawingSection">
      {/* Toggle Calca/Libre */}
      <div className="topControls">
        <div className="traceModeToggle" role="group" aria-label="Modo de práctica" data-demo="letters-mode">
          <button
            type="button"
            className={`traceModeBtn ${traceMode ? "is-active" : ""}`}
            onClick={() => {
              captureEvent("mode_changed", { screen: "letters", mode: "calca" });
              setTraceMode(true);
            }}
          >
            Calca
          </button>
          <button
            type="button"
            className={`traceModeBtn ${!traceMode ? "is-active" : ""}`}
            onClick={() => {
              captureEvent("mode_changed", { screen: "letters", mode: "libre" });
              setTraceMode(false);
            }}
          >
            Libre
          </button>
        </div>
      </div>

      {/* Canvas con controles internos */}
      <div className={`canvasWrapper ${canvasStatusClass}`} data-demo="letters-canvas">
        {traceMode && (
          <svg viewBox="0 0 100 110" className="traceWatermark" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            <rect x="0" y="0" width="100" height="110" fill="rgba(215, 209, 238, 0.08)" />
            {(LETTER_STROKES[letter] || []).map((d, i) => (
              <path
                key={`watermark-${letter}-${i}`}
                d={d}
                stroke="#c7bce8"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
        {/* Borrar: esquina superior izquierda dentro del canvas */}
        <button type="button" onClick={() => {
          captureEvent("canvas_cleared", { screen: "letters" });
          clearCanvas();
        }} className="canvasClearBtn" aria-label="Borrar" data-demo="letters-clear">
          ↺
        </button>
        {/* Botón unificado: tip → resultado → éxito */}
        <button
          type="button"
          className={`canvasInfoBtn ${result && liveScore >= 70 && result.isCorrect ? "is-success" : result && liveScore > 0 ? "is-result" : ""}`}
          aria-label="Verificar o ayuda"
          data-demo="letters-hint"
          disabled={isValidating}
          onClick={() => {
            if (isValidating) return;
            captureEvent("hint_or_verify_clicked", {
              screen: "letters",
              state: result && result.isCorrect && liveScore >= 70 ? "success" : result && liveScore > 0 ? "verify" : "hint",
            });
            // Estado 3: éxito → reproducir audio de éxito
            if (result && result.isCorrect && liveScore >= 70) {
              const msg = coaching
                ? `${coaching.message} ${coaching.encouragement}`
                : `La letra ${letter} se reconoce muy bien.`;
              speakFeedback(msg, voice);
              return;
            }
            // Estado 2: hay contenido pero no es correcto → verificar formalmente + reproducir consejo
            if (result && liveScore > 0 && !(result.isCorrect && liveScore >= 70)) {
              handleVerify();
              return;
            }
            // Estado 1: lienzo vacío o sin resultado → dar instrucciones de audio
            const intro = traceMode
              ? `Sigue la forma de la letra ${letter} con tu dedo, despacito.`
              : `Dibuja la letra ${letter} con tu dedo y después toca aquí para verificar.`;
            speakFeedback(intro, voice);
          }}
        >
          {isValidating
            ? "..."
            : result && result.isCorrect && liveScore >= 70
              ? "⭐"
              : result && liveScore > 0
                ? `${result.predictedLetter}?`
                : "💡"}
        </button>
      </div>

    </div>
  );
}

export default function Home() {
  const [index, setIndex] = useState(0);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canUseFullscreen, setCanUseFullscreen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const startXRef = useRef<number | null>(null);
  const ambientSoundRef = useRef<HTMLAudioElement | null>(null);

  const spanishVoice = useMemo(() => 
    voices.find(v => v.lang.startsWith("es")) || voices[0] || null
  , [voices]);

  const letter = SPANISH_ALPHABET[index];

  // Pronunciar la letra al cambiar
  useEffect(() => {
    if (!speechSupported || !voices.length) return;
    
    const synth = window.speechSynthesis;
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(letter.letter);
    utterance.lang = "es-MX";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const spanishVoice = voices.find(v => v.lang.startsWith("es"));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synth.speak(utterance);
  }, [index, voices, speechSupported]);

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

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          (document as Document & WebkitDoc).webkitFullscreenElement,
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + SPANISH_ALPHABET.length) % SPANISH_ALPHABET.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % SPANISH_ALPHABET.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUseFullscreen]);

  const toggleFullscreen = async () => {
    if (!canUseFullscreen || typeof document === "undefined") return;

    try {
      const elem = document.documentElement as HTMLElement & {
        mozRequestFullScreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
      };

      if (isFullscreen) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as Document & WebkitDoc).webkitExitFullscreen) {
          (document as Document & WebkitDoc).webkitExitFullscreen?.();
        }
      } else {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      }
    } catch {
      // silencioso
    }
  };

  const playTapSound = () => {
    if (typeof window === "undefined") return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 600;
    oscillator.type = "sine";

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  };

  const handlePrev = () => {
    playTapSound();
    setIndex((i) => (i - 1 + SPANISH_ALPHABET.length) % SPANISH_ALPHABET.length);
  };

  const handleNext = () => {
    playTapSound();
    setIndex((i) => (i + 1) % SPANISH_ALPHABET.length);
  };

  const handleSwipe = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];

    if (startXRef.current === null) {
      startXRef.current = touch.clientX;
      return;
    }

    const diff = startXRef.current - touch.clientX;

    if (Math.abs(diff) > MIN_SWIPE_DISTANCE) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      startXRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    startXRef.current = null;
  };

  return (
    <main className="mainContainer">
      <VersionLabel />
      {/* Home button fijo arriba-izquierda */}
      <Link href="/" className="homeBtn" aria-label="Inicio">
        🏠
      </Link>
      <div className="topRightActions">
        {/* Fullscreen toggle fijo arriba-derecha */}
        {canUseFullscreen && (
          <button
            type="button"
            className="fullscreenBtn"
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? "🔲" : "⛶"}
          </button>
        )}
      </div>
      <div
        className="container"
      >
        <div className="demoInlineRow">
          <button
            type="button"
            className="demoInlineBtn"
            data-demo="letters-demo-button"
            onClick={() => {
              captureEvent("demo_replayed", { screen: "letters" });
              runLettersDemo();
            }}
            aria-label="Ver demo"
          >
            ✨ Ver demo
          </button>
        </div>
        {/* Encabezado: nav + contador */}
        <div
          className="header"
          onTouchStart={(e) => { startXRef.current = e.touches[0].clientX; }}
          onTouchMove={handleSwipe}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="navBtn prevBtn"
            onClick={() => {
              captureEvent("navigation_clicked", { screen: "letters", direction: "prev" });
              handlePrev();
            }}
            aria-label="Letra anterior"
            data-demo="letters-prev"
          >
            ◀
          </button>
          <div className="letterDisplay" data-demo="letters-symbol">
            <span className="letterIndex">
              {letter.letter} — {index + 1}/{SPANISH_ALPHABET.length}
            </span>
          </div>
          <button
            type="button"
            className="navBtn nextBtn"
            onClick={() => {
              captureEvent("navigation_clicked", { screen: "letters", direction: "next" });
              handleNext();
            }}
            aria-label="Siguiente letra"
            data-demo="letters-next"
          >
            ▶
          </button>
        </div>

        {/* Animación de trazos como letra principal */}
        <div data-demo="letters-animation">
        <AnimatedLetterGuide
          letter={letter.letter}
          onTap={() => {
            if (!speechSupported || !voices.length) return;
            const synth = window.speechSynthesis;
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(letter.letter);
            utterance.lang = "es-MX";
            utterance.rate = 1.0;
            const spanishVoice = voices.find(v => v.lang.startsWith("es"));
            if (spanishVoice) utterance.voice = spanishVoice;
            synth.speak(utterance);
          }}
          onSwipeLeft={handleNext}
          onSwipeRight={handlePrev}
        />
        </div>

        {/* Canvas principal para dibujar */}
        <DrawingCanvas letter={letter.letter} onComplete={() => {}} voice={spanishVoice} />

        {/* Info */}
        <div className="generalControls">
          {speechError && <p className="error">{speechError}</p>}
        </div>
      </div>
    </main>
  );
}