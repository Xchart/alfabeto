/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { TouchEvent, MouseEvent } from "react";
import { validateLetter, speakFeedback, type ValidationResult } from "./lib/letterValidator";
import { analyzeStroke, generateCoachFeedback, type CoachFeedback } from "./lib/writingCoach";

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
}: {
  letter: string;
  onReplay?: () => void;
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
    <div className="animatedGuide">
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

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.strokeStyle = "#2e2452";
    ctx.lineWidth = 6;
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
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#2e2452";
    ctx.lineWidth = 6;
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

  // Color de la barra de progreso según score
  const progressColor = liveScore >= 70 ? "#10b981" : liveScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="drawingSection">
      {/* Botones ARRIBA del canvas */}
      <div className="drawingControls">
        <button type="button" onClick={clearCanvas} className="clearBtn">
          Borrar
        </button>
        <button
          type="button"
          onClick={handleVerify}
          className="submitBtn"
          disabled={isValidating}
        >
          {isValidating ? "Revisando..." : "✅ Verificar"}
        </button>
      </div>

      {/* Canvas con barra de progreso integrada */}
      <div className="canvasWrapper">
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
        {/* Barra de progreso en tiempo real */}
        <div className="liveProgressBar">
          <div
            className="liveProgressFill"
            style={{ width: `${liveScore}%`, backgroundColor: progressColor }}
          />
        </div>
        {/* Indicador de letra detectada */}
        {result && liveScore > 0 && !showFeedback && (
          <div className="liveIndicator">
            {result.isCorrect ? "✅" : `→ ${result.predictedLetter}`}
          </div>
        )}
      </div>

      {/* Feedback detallado solo al tocar Verificar */}
      {showFeedback && result && coaching && (
        <div className={`feedbackCard ${result.isCorrect ? "is-correct" : "is-retry"}`}>
          <button
            type="button"
            className="feedbackClose"
            onClick={dismissFeedback}
            aria-label="Cerrar feedback"
          >
            ✕
          </button>
          <div className="feedbackIcon">{result.isCorrect ? "⭐" : "💪"}</div>
          <p className="feedbackText">{coaching.message}</p>
          {coaching.tips.length > 0 && (
            <ul className="feedbackTips">
              {coaching.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
          <p className="feedbackEncouragement">{coaching.encouragement}</p>
          <button
            type="button"
            className="replayAudioBtn"
            onClick={() => speakFeedback(`${coaching.message} ${coaching.encouragement}`, voice)}
          >
            🔊 Escuchar de nuevo
          </button>
        </div>
      )}
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
  const [mode, setMode] = useState<"browse" | "draw">("browse");

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
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement) {
        toggleFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler as EventListener);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler as EventListener);
      document.removeEventListener("keydown", handleEscapeKey);
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
  const currentLetter = SPANISH_ALPHABET[index].letter;

  const handleStartDrawing = () => {
    setMode("draw");
  };

  const handleDrawingComplete = () => {
    // Cancelar audio al salir
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setMode("browse");
  };

  const handleDrawPrev = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIndex((current) => wrapIndex(current - 1));
  };

  const handleDrawNext = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIndex((current) => wrapIndex(current + 1));
  };

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
          <>
            <p className="hint">Desliza para cambiar y toca la letra central para escucharla.</p>
            {mode === "browse" && (
              <button
                type="button"
                className="drawBtn"
                onClick={handleStartDrawing}
              >
                ✏️ Aprende a dibujar esta letra
              </button>
            )}
          </>
        )}

        <audio ref={ambientSoundRef} src="/sounds/tap.wav" preload="auto" aria-hidden="true" />
      </section>

      {mode === "draw" && (
        <section className="drawingCard" aria-live="polite">
          <header className="drawingHeader">
            <button
              type="button"
              className="drawNavBtn"
              onClick={handleDrawPrev}
              aria-label="Letra anterior"
            >
              ❮
            </button>
            <h2>Letra {currentLetter}</h2>
            <button
              type="button"
              className="drawNavBtn"
              onClick={handleDrawNext}
              aria-label="Letra siguiente"
            >
              ❯
            </button>
            <button
              type="button"
              className="closeDrawing"
              onClick={handleDrawingComplete}
              aria-label="Cerrar modo dibujo"
            >
              ✕
            </button>
          </header>

          <AnimatedLetterGuide letter={currentLetter} />
          <DrawingCanvas letter={currentLetter} onComplete={handleDrawingComplete} voice={latinAmericanVoice} />
        </section>
      )}
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
