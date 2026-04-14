/**
 * Servicio de Gemma on-device via MediaPipe LLM Inference API.
 *
 * Descarga Gemma 4 E2B Web al dispositivo del usuario,
 * lo cachea via Cache API (streaming, sin acumular en RAM),
 * y ejecuta inferencia local con WebGPU.
 */

export type GemmaStatus = "idle" | "checking" | "downloading" | "loading" | "ready" | "error" | "unsupported";

export type GemmaState = {
  status: GemmaStatus;
  progress: number;
  error?: string;
  detail?: string;
};

const MODEL_URL = "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task";
const MODEL_CACHE_KEY = "chispa-gemma-4-e2b";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm";

let llmInference: any = null;
let isInitializing = false;

export function isWebGPUSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator;
}

export async function isModelCached(): Promise<boolean> {
  try {
    const cache = await caches.open(MODEL_CACHE_KEY);
    const response = await cache.match(MODEL_URL);
    return response !== null && response !== undefined;
  } catch {
    return false;
  }
}

export async function clearModelCache(): Promise<void> {
  try {
    await caches.delete(MODEL_CACHE_KEY);
  } catch {
    // silencioso
  }
}

async function downloadAndCacheModel(onProgress: (pct: number) => void): Promise<void> {
  const cache = await caches.open(MODEL_CACHE_KEY);
  const cached = await cache.match(MODEL_URL);
  if (cached) {
    onProgress(100);
    return;
  }

  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const contentLength = Number(response.headers.get("content-length") || 0);
  const reader = response.body.getReader();
  let received = 0;

  const trackedStream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      received += value.length;
      if (contentLength > 0) {
        onProgress(Math.round((received / contentLength) * 100));
      }
      controller.enqueue(value);
    },
  });

  const cacheResponse = new Response(trackedStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": contentLength.toString(),
    },
  });

  await cache.put(MODEL_URL, cacheResponse);
  onProgress(100);
}

export async function initGemma(
  onStateChange: (state: GemmaState) => void,
): Promise<boolean> {
  if (llmInference) {
    onStateChange({ status: "ready", progress: 100, detail: "Modelo ya inicializado en memoria." });
    return true;
  }

  if (isInitializing) {
    onStateChange({ status: "loading", progress: 100, detail: "Ya hay una inicialización en progreso..." });
    return false;
  }
  isInitializing = true;

  try {
    if (!isWebGPUSupported()) {
      onStateChange({
        status: "unsupported",
        progress: 0,
        error: "Tu navegador no soporta WebGPU",
        detail: "Se requiere WebGPU para ejecutar Gemma 4 localmente.",
      });
      isInitializing = false;
      return false;
    }

    onStateChange({
      status: "checking",
      progress: 0,
      detail: "Verificando compatibilidad y si el modelo ya existe en cache...",
    });
    const isCached = await isModelCached();

    if (!isCached) {
      onStateChange({
        status: "downloading",
        progress: 0,
        detail: "Iniciando descarga del modelo Gemma 4 E2B Web...",
      });
    }

    await downloadAndCacheModel((pct) => {
      onStateChange({
        status: isCached ? "loading" : "downloading",
        progress: pct,
        detail: isCached ? "Modelo encontrado en cache. Preparando carga..." : `Descargando modelo... ${pct}%`,
      });
    });

    onStateChange({ status: "loading", progress: 100, detail: "Importando runtime de MediaPipe GenAI..." });
    const { LlmInference, FilesetResolver } = await import("@mediapipe/tasks-genai");

    onStateChange({ status: "loading", progress: 100, detail: "Inicializando runtime WebAssembly..." });
    const genaiFileset = await FilesetResolver.forGenAiTasks(WASM_BASE);

    onStateChange({ status: "loading", progress: 100, detail: "Creando instancia del modelo Gemma 4..." });
    llmInference = await LlmInference.createFromOptions(genaiFileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
      },
      maxTokens: 256,
      topK: 10,
      temperature: 0.7,
    });

    onStateChange({ status: "ready", progress: 100, detail: "Gemma 4 lista para generar tips y feedback." });
    isInitializing = false;
    return true;
  } catch (err: any) {
    console.error("[Gemma] Init error:", err);
    onStateChange({
      status: "error",
      progress: 0,
      error: err.message || "Error al cargar modelo",
      detail: `Fallo durante la inicialización: ${err.message || "error desconocido"}`,
    });
    isInitializing = false;
    return false;
  }
}

export async function generateText(prompt: string): Promise<string> {
  if (!llmInference) throw new Error("Modelo no inicializado");
  const response = await llmInference.generateResponse(prompt);
  return response.trim();
}

export async function generateFeedback(
  symbol: string,
  isCorrect: boolean,
  predictedSymbol: string,
  type: "letra" | "número",
): Promise<string> {
  const context = isCorrect
    ? `El niño dibujó correctamente ${type === "letra" ? "la letra" : "el número"} ${symbol}.`
    : `El niño intentó dibujar ${type === "letra" ? "la letra" : "el número"} ${symbol}, pero el sistema detectó un ${predictedSymbol}.`;

  const prompt = `Eres un tutor de escritura para niños de 4-6 años. ${context}
Da retroalimentación breve (1-2 oraciones) usando "process praise": elogia el esfuerzo, nunca la identidad. Responde solo con la retroalimentación.`;

  try {
    return await generateText(prompt);
  } catch {
    return "";
  }
}

export async function generateTip(
  symbol: string,
  type: "letra" | "número",
  mode: "calca" | "libre",
): Promise<string> {
  const prompt = `Eres un tutor para niños de 4-6 años. El niño va a practicar ${type === "letra" ? "la letra" : "el número"} ${symbol} en modo ${mode === "calca" ? "calca" : "libre"}.
Da una instrucción breve (1 oración). Responde solo con la instrucción.`;

  try {
    return await generateText(prompt);
  } catch {
    return "";
  }
}

export function isGemmaReady(): boolean {
  return llmInference !== null;
}

export function isGemmaEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("chispa-gemma-enabled") === "true";
}
