/**
 * Coach de escritura para primeros lectores/escritores.
 *
 * Basado en:
 * - Carol Dweck (Stanford): "Process Praise" — elogiar esfuerzo, estrategia
 *   y progreso, nunca habilidad innata ni identidad.
 *   Ref: "The Perils and Promises of Praise" (ASCD, 2007)
 * - Gunderson et al. (2018): El tipo de elogio a los 1-3 años predice
 *   rendimiento académico en 4to grado.
 * - KQED/MindShift: Para preescolares, usar frases descriptivas sobre
 *   lo que hicieron, no juicios sobre quiénes son.
 *
 * Reglas de refuerzo:
 * ✅ "Te esforzaste mucho en esa letra" (proceso)
 * ✅ "Seguiste intentando aunque era difícil" (persistencia)
 * ✅ "Mira cómo mejoraste el trazo" (progreso)
 * ✅ "Encontraste una buena forma de hacerlo" (estrategia)
 * ❌ "Eres el mejor" (identidad)
 * ❌ "Qué listo eres" (habilidad fija)
 * ❌ "Perfecto" / "Eres increíble" (juicio absoluto)
 */

export type StrokeAnalysis = {
  coverage: number;
  centerX: number;
  centerY: number;
  aspectRatio: number;
  density: number;
  hasContent: boolean;
};

export type CoachFeedback = {
  message: string;
  tips: string[];
  encouragement: string;
  fullAudio: string;
};

/**
 * Analiza los trazos en el canvas.
 */
export function analyzeStroke(canvas: HTMLCanvasElement): StrokeAnalysis {
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = data.data;
  const totalPixels = canvas.width * canvas.height;

  let inkPixels = 0;
  let sumX = 0;
  let sumY = 0;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const a = pixels[idx + 3]; // alpha
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Detectar tinta (no transparente y no blanco)
      if (a > 30 && (r < 220 || g < 220 || b < 220)) {
        inkPixels++;
        sumX += x;
        sumY += y;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (inkPixels === 0) {
    return {
      coverage: 0,
      centerX: 0.5,
      centerY: 0.5,
      aspectRatio: 1,
      density: 0,
      hasContent: false,
    };
  }

  const bbWidth = maxX - minX + 1;
  const bbHeight = maxY - minY + 1;
  const bbArea = bbWidth * bbHeight;

  return {
    coverage: (inkPixels / totalPixels) * 100,
    centerX: sumX / inkPixels / canvas.width,
    centerY: sumY / inkPixels / canvas.height,
    aspectRatio: bbWidth / bbHeight,
    density: (inkPixels / bbArea) * 100,
    hasContent: true,
  };
}

// --- Frases basadas en Process Praise (Dweck) ---

// Esfuerzo y proceso (cuando va bien)
const PROCESS_PRAISE_GOOD = [
  "Se nota que te esforzaste en cada trazo.",
  "Pusiste mucha atención al dibujarla.",
  "Seguiste la forma con mucho cuidado.",
  "Trabajaste con calma y se nota.",
  "Tu mano siguió bien el camino de la letra.",
];

// Progreso (cuando mejora o está en camino)
const PROCESS_PRAISE_MID = [
  "Estás encontrando la forma de la letra, sigue así.",
  "Cada vez que practicas, tu trazo mejora un poquito.",
  "Mira cómo ya se va pareciendo. Vas avanzando.",
  "Tu esfuerzo se nota. La forma ya se reconoce.",
  "Poco a poco vas controlando mejor el trazo.",
];

// Persistencia (cuando necesita más práctica)
const PROCESS_PRAISE_RETRY = [
  "Aprender lleva tiempo, y tú estás practicando. Eso es lo que importa.",
  "Cada intento te ayuda a conocer mejor la letra.",
  "No pasa nada. Vuelve a mirar la guía y prueba otra vez.",
  "La práctica es lo que te va a ayudar. Inténtalo de nuevo.",
  "Fíjate bien en la forma y vuelve a intentarlo con calma.",
];

// Aliento (nunca sobre identidad, siempre sobre acción)
const ENCOURAGEMENT_GOOD = [
  "Tu esfuerzo dio resultado.",
  "Así se practica.",
  "Buen trabajo con ese trazo.",
];

const ENCOURAGEMENT_MID = [
  "Sigue practicando, vas bien.",
  "Un intento más y lo vas a lograr.",
  "La práctica te va acercando.",
];

const ENCOURAGEMENT_RETRY = [
  "Intentar otra vez es parte de aprender.",
  "Mira la guía y prueba de nuevo.",
  "Cada intento cuenta.",
];

// Sin contenido
const NO_CONTENT = [
  `Usa tu dedo para dibujar la letra en el cuadro.`,
  `Dibuja con tu dedo siguiendo la forma de la guía.`,
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera feedback basado en process praise.
 */
export function generateCoachFeedback(
  letter: string,
  score: number,
  analysis: StrokeAnalysis,
): CoachFeedback {
  const tips: string[] = [];

  if (!analysis.hasContent) {
    const msg = pick(NO_CONTENT);
    return {
      message: msg,
      tips: [],
      encouragement: "Cuando quieras, empieza a dibujar.",
      fullAudio: msg,
    };
  }

  // Tips geométricos (breves, concretos)
  const offCenterX = Math.abs(analysis.centerX - 0.5);
  const offCenterY = Math.abs(analysis.centerY - 0.5);

  if (offCenterX > 0.15) {
    tips.push(
      analysis.centerX < 0.5
        ? "Intenta dibujar un poco más al centro."
        : "Intenta dibujar un poco más al centro.",
    );
  }

  if (offCenterY > 0.15) {
    tips.push("Trata de centrar la letra en el cuadro.");
  }

  if (analysis.coverage < 1.5) {
    tips.push("Puedes hacerla un poco más grande.");
  }

  let message: string;
  let encouragement: string;

  if (score >= 70) {
    message = pick(PROCESS_PRAISE_GOOD);
    encouragement = pick(ENCOURAGEMENT_GOOD);
    if (tips.length === 0) {
      tips.push("Sigue practicando así.");
    }
  } else if (score >= 40) {
    message = pick(PROCESS_PRAISE_MID);
    encouragement = pick(ENCOURAGEMENT_MID);
    if (tips.length === 0) {
      tips.push("Observa la guía y fíjate por dónde va cada trazo.");
    }
  } else {
    message = pick(PROCESS_PRAISE_RETRY);
    encouragement = pick(ENCOURAGEMENT_RETRY);
    if (tips.length === 0) {
      tips.push("Mira la animación otra vez. Fíjate por dónde empieza la letra.");
    }
  }

  const audioTip = tips.length > 0 ? tips[0] : "";
  const fullAudio = `${message} ${audioTip} ${encouragement}`;

  return { message, tips, encouragement, fullAudio };
}
