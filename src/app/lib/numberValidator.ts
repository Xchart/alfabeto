/**
 * Validador de dígitos usando modelo CNN MNIST/EMNIST Digits.
 * Misma arquitectura que letterValidator pero con 10 clases (0-9).
 * Accuracy en test: ~99.11%
 */

import * as tf from "@tensorflow/tfjs";

const CANVAS_SIZE = 28;
const LABELS = "0123456789";

let model: tf.LayersModel | null = null;
let modelReady: Promise<void> | null = null;

export type DigitValidationResult = {
  score: number;
  isCorrect: boolean;
  predictedDigit: string;
  confidence: number;
  feedback: string;
};

function buildModel(): tf.LayersModel {
  const m = tf.sequential();
  m.add(tf.layers.conv2d({ inputShape: [28, 28, 1], filters: 32, kernelSize: 3, activation: "relu", padding: "same" }));
  m.add(tf.layers.batchNormalization());
  m.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  m.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: "relu", padding: "same" }));
  m.add(tf.layers.batchNormalization());
  m.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  m.add(tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: "relu", padding: "same" }));
  m.add(tf.layers.batchNormalization());
  m.add(tf.layers.globalAveragePooling2d({}));
  m.add(tf.layers.dropout({ rate: 0.3 }));
  m.add(tf.layers.dense({ units: 64, activation: "relu" }));
  m.add(tf.layers.dropout({ rate: 0.2 }));
  m.add(tf.layers.dense({ units: 10, activation: "softmax" }));
  return m;
}

function getBasePath(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/chispa")) {
    return "/chispa";
  }
  return "";
}

async function loadWeights(m: tf.LayersModel): Promise<void> {
  const base = getBasePath();
  const response = await fetch(`${base}/model-digits/group1-shard1of1.bin`);
  const buffer = await response.arrayBuffer();
  const data = new Float32Array(buffer);

  const specsResponse = await fetch(`${base}/model-digits/weights_spec.json`);
  const specs: Array<{ name: string; shape: number[]; dtype: string }> = await specsResponse.json();

  const tensors: tf.Tensor[] = [];
  let offset = 0;
  for (const spec of specs) {
    const size = spec.shape.reduce((a, b) => a * b, 1);
    const values = data.slice(offset, offset + size);
    tensors.push(tf.tensor(values, spec.shape));
    offset += size;
  }

  m.setWeights(tensors);
  tensors.forEach((t) => t.dispose());
}

async function ensureModel(): Promise<tf.LayersModel> {
  if (model) return model;
  if (modelReady) { await modelReady; return model!; }

  modelReady = (async () => {
    console.log("[DIGITS] Building model...");
    const m = buildModel();
    const dummy = tf.zeros([1, 28, 28, 1]);
    const out = m.predict(dummy) as tf.Tensor;
    out.dispose();
    dummy.dispose();
    console.log(`[DIGITS] Model has ${m.weights.length} weight tensors`);
    await loadWeights(m);
    console.log("[DIGITS] Model ready!");
    model = m;
  })();

  await modelReady;
  return model!;
}

function preprocessCanvas(canvas: HTMLCanvasElement): tf.Tensor4D {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = CANVAS_SIZE;
  tempCanvas.height = CANVAS_SIZE;
  const ctx = tempCanvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const srcW = canvas.width;
  const srcH = canvas.height;
  const midSize = 200;
  const scaleFactor = midSize / Math.max(srcW, srcH);
  const midW = Math.round(srcW * scaleFactor);
  const midH = Math.round(srcH * scaleFactor);

  const midCanvas = document.createElement("canvas");
  midCanvas.width = midW;
  midCanvas.height = midH;
  const midCtx = midCanvas.getContext("2d")!;
  midCtx.fillStyle = "white";
  midCtx.fillRect(0, 0, midW, midH);
  midCtx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, midW, midH);

  const sourceData = midCtx.getImageData(0, 0, midW, midH);
  let minX = midW, minY = midH, maxX = 0, maxY = 0;
  let hasContent = false;

  for (let y = 0; y < midH; y++) {
    for (let x = 0; x < midW; x++) {
      const idx = (y * midW + x) * 4;
      const r = sourceData.data[idx];
      const g = sourceData.data[idx + 1];
      const b = sourceData.data[idx + 2];
      if (r < 235 && g < 235 && b < 235) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (hasContent) {
    const padding = 2;
    const drawWidth = maxX - minX + 1;
    const drawHeight = maxY - minY + 1;
    const targetSize = CANVAS_SIZE - padding * 2;
    const s = Math.min(targetSize / drawWidth, targetSize / drawHeight);
    const scaledW = drawWidth * s;
    const scaledH = drawHeight * s;
    const offsetX = (CANVAS_SIZE - scaledW) / 2;
    const offsetY = (CANVAS_SIZE - scaledH) / 2;
    ctx.drawImage(midCanvas, minX, minY, drawWidth, drawHeight, offsetX, offsetY, scaledW, scaledH);
  }

  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const pixelData = new Float32Array(CANVAS_SIZE * CANVAS_SIZE);
  for (let i = 0; i < CANVAS_SIZE * CANVAS_SIZE; i++) {
    const gray = (imageData.data[i * 4] + imageData.data[i * 4 + 1] + imageData.data[i * 4 + 2]) / 3;
    pixelData[i] = (255 - gray) / 255;
  }

  return tf.tensor4d(pixelData, [1, CANVAS_SIZE, CANVAS_SIZE, 1]);
}

function generateFeedback(expected: string, predicted: string, confidence: number): string {
  if (predicted === expected) {
    if (confidence > 0.8) {
      const m = [
        `Se nota que pusiste atención al dibujar el ${expected}.`,
        `Tu trazo del ${expected} siguió bien la forma.`,
        `El ${expected} se reconoce muy bien. Tu esfuerzo se nota.`,
      ];
      return m[Math.floor(Math.random() * m.length)];
    }
    return `El ${expected} ya se reconoce. Sigue practicando para mejorar el trazo.`;
  }
  const m = [
    `Tu dibujo se parece más a un ${predicted}. Mira la guía del ${expected} y vuelve a intentarlo.`,
    `Parece un ${predicted}. Fíjate en la forma del ${expected} y prueba de nuevo.`,
  ];
  return m[Math.floor(Math.random() * m.length)];
}

export async function validateDigit(canvas: HTMLCanvasElement, digit: string): Promise<DigitValidationResult> {
  const m = await ensureModel();
  const input = preprocessCanvas(canvas);
  const prediction = m.predict(input) as tf.Tensor;
  const probs = await prediction.data();

  const expectedIdx = LABELS.indexOf(digit);
  let maxIdx = 0, maxProb = 0;
  let secondIdx = 0, secondProb = 0;
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > maxProb) {
      secondIdx = maxIdx; secondProb = maxProb;
      maxProb = probs[i]; maxIdx = i;
    } else if (probs[i] > secondProb) {
      secondProb = probs[i]; secondIdx = i;
    }
  }

  const predictedDigit = LABELS[maxIdx];
  const confidence = maxProb;
  const expectedConfidence = expectedIdx >= 0 ? probs[expectedIdx] : 0;
  const score = Math.round(expectedConfidence * 100);

  const isCorrect = predictedDigit === digit
    || (LABELS[secondIdx] === digit && secondProb > 0.15);

  const effectiveScore = isCorrect ? Math.max(score, 70) : score;
  const feedback = generateFeedback(digit, predictedDigit, confidence);

  input.dispose();
  prediction.dispose();

  return { score: effectiveScore, isCorrect, predictedDigit, confidence, feedback };
}
