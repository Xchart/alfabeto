/**
 * Coach inteligente de escritura.
 *
 * Genera feedback personalizado y detallado basado en el análisis
 * del trazo del usuario. Analiza la cobertura, proporción, centrado
 * y densidad del dibujo para dar consejos específicos.
 *
 * Diseñado para usuarios que están aprendiendo a leer/escribir,
 * así que el tono es motivador, claro y amigable.
 *
 * Fase futura: reemplazar/complementar con MediaPipe + Gemma on-device
 * cuando WebGPU sea más accesible en dispositivos móviles.
 */

export type StrokeAnalysis = {
  coverage: number; // % del canvas con tinta
  centerX: number; // centro X normalizado (0-1, 0.5 = centrado)
  centerY: number; // centro Y normalizado (0-1, 0.5 = centrado)
  aspectRatio: number; // ancho/alto del bounding box
  density: number; // concentración de tinta
  hasContent: boolean;
};

export type CoachFeedback = {
  message: string; // Texto principal
  tips: string[]; // Consejos específicos
  encouragement: string; // Frase motivadora
  fullAudio: string; // Todo junto para TTS
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
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Detectar tinta (no blanco)
      if (r < 200 || g < 200 || b < 200) {
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

/**
 * Genera feedback de coach basado en el score y el análisis del trazo.
 */
export function generateCoachFeedback(
  letter: string,
  score: number,
  analysis: StrokeAnalysis,
): CoachFeedback {
  const tips: string[] = [];

  // Si no hay contenido
  if (!analysis.hasContent) {
    return {
      message: `¡Vamos! Dibuja la letra ${letter} en el cuadro.`,
      tips: ["Usa tu dedo para dibujar sobre el cuadro blanco."],
      encouragement: "¡Tú puedes hacerlo!",
      fullAudio: `¡Vamos! Dibuja la letra ${letter} en el cuadro. Usa tu dedo para dibujar. ¡Tú puedes hacerlo!`,
    };
  }

  // Analizar centrado
  const offCenterX = Math.abs(analysis.centerX - 0.5);
  const offCenterY = Math.abs(analysis.centerY - 0.5);

  if (offCenterX > 0.15) {
    tips.push(
      analysis.centerX < 0.5
        ? "Intenta dibujar un poco más hacia la derecha."
        : "Intenta dibujar un poco más hacia la izquierda.",
    );
  }

  if (offCenterY > 0.15) {
    tips.push(
      analysis.centerY < 0.5
        ? "Tu letra está un poco arriba. Trata de centrarla más."
        : "Tu letra está un poco abajo. Trata de centrarla más.",
    );
  }

  // Analizar cobertura
  if (analysis.coverage < 2) {
    tips.push("Tu dibujo es un poco pequeño. Intenta hacer la letra más grande para que llene más el cuadro.");
  } else if (analysis.coverage > 25) {
    tips.push("Tu dibujo ocupa mucho espacio. Intenta hacer trazos más finos y precisos.");
  }

  // Analizar densidad
  if (analysis.density < 10) {
    tips.push("Los trazos están muy separados. Intenta que las líneas estén más conectadas.");
  }

  // Generar mensaje principal según score
  let message: string;
  let encouragement: string;

  if (score >= 75) {
    const options = [
      `¡Excelente trabajo! Tu letra ${letter} se ve muy bien.`,
      `¡Increíble! Dibujaste una ${letter} casi perfecta.`,
      `¡Bravo! Esa ${letter} está hermosa. Eres muy bueno dibujando letras.`,
    ];
    message = options[Math.floor(Math.random() * options.length)];

    const encouragements = [
      "¡Sigue así, eres una estrella!",
      "¡Lo estás haciendo genial! ¿Pasamos a la siguiente letra?",
      "¡Eres increíble! La práctica te está haciendo un experto.",
    ];
    encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    // Si es perfecto, no dar tips
    if (tips.length === 0) {
      tips.push("¡Tu trazo está muy bien! Sigue practicando para ser aún mejor.");
    }
  } else if (score >= 50) {
    const options = [
      `¡Buen intento con la letra ${letter}! Vas por buen camino.`,
      `La ${letter} ya se puede reconocer. ¡Casi lo tienes!`,
      `¡Muy bien! Tu ${letter} está mejorando mucho.`,
    ];
    message = options[Math.floor(Math.random() * options.length)];

    const encouragements = [
      "¡No te rindas, cada intento te hace mejor!",
      "¡Vas genial! Un poquito más de práctica y lo tendrás perfecto.",
      "¡Sigue adelante! La práctica hace al maestro.",
    ];
    encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    if (tips.length === 0) {
      tips.push("Observa la animación otra vez y fíjate en la forma de cada trazo.");
    }
  } else if (score >= 25) {
    const options = [
      `La letra ${letter} necesita un poco más de trabajo. ¡Pero no te preocupes!`,
      `Tu ${letter} está tomando forma. Mira la guía y vuelve a intentarlo.`,
    ];
    message = options[Math.floor(Math.random() * options.length)];

    const encouragements = [
      "¡Todos empezamos así! Cada intento cuenta.",
      "¡No te desanimes! Los mejores escritores practican mucho.",
    ];
    encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    if (tips.length === 0) {
      tips.push("Mira bien la animación de la letra y trata de seguir el mismo camino con tu dedo.");
    }
  } else {
    const options = [
      `¡Vamos a intentar la ${letter} otra vez! Mira la animación con atención.`,
      `La ${letter} es una letra interesante. Observa cómo se dibuja y prueba de nuevo.`,
    ];
    message = options[Math.floor(Math.random() * options.length)];

    const encouragements = [
      "¡No pasa nada! Aprender a escribir es un viaje y tú vas a llegar lejos.",
      "¡Ánimo! Cada intento te acerca más. ¡Vamos de nuevo!",
    ];
    encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    tips.push("Fíjate bien en la animación: observa por dónde empieza y por dónde termina cada trazo.");
  }

  // Construir el audio completo (para TTS)
  const audioTips =
    tips.length > 0 ? tips[0] : ""; // Solo el primer tip para no hacer el audio muy largo
  const fullAudio = `${message} ${audioTips} ${encouragement}`;

  return { message, tips, encouragement, fullAudio };
}
