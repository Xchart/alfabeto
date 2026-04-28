"use client";

export type ChispaProgress = {
  lettersCompleted: string[];
  numbersCompleted: string[];
  tracesCompleted: string[];
  streakDays: number;
  stars: number;
  lastPracticeDate?: string;
};

const KEY = "chispa-progress-v1";
export const PROGRESS_UPDATED_EVENT = "chispa-progress-updated";

const DEFAULT_PROGRESS: ChispaProgress = {
  lettersCompleted: [],
  numbersCompleted: [],
  tracesCompleted: [],
  streakDays: 0,
  stars: 0,
};

export function getProgress(): ChispaProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: ChispaProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail: progress }));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function markCompleted(kind: "letters" | "numbers" | "traces", id: string): ChispaProgress {
  const progress = getProgress();
  const key = kind === "letters" ? "lettersCompleted" : kind === "numbers" ? "numbersCompleted" : "tracesCompleted";
  const current = new Set(progress[key]);
  const wasNew = !current.has(id);
  current.add(id);

  const today = todayKey();
  const next: ChispaProgress = {
    ...progress,
    [key]: Array.from(current),
    stars: progress.stars + (wasNew ? 1 : 0),
    streakDays: progress.lastPracticeDate === today ? progress.streakDays : Math.max(1, progress.streakDays + 1),
    lastPracticeDate: today,
  };

  saveProgress(next);
  return next;
}

export function getDailyChallenge() {
  const challenges = [
    { title: "Sigue la ola", description: "Practica una curva suave y continua.", icon: "🌊" },
    { title: "Sube la montaña", description: "Haz líneas diagonales con calma.", icon: "⛰️" },
    { title: "Lluvia de puntos", description: "Toca puntos pequeños sin arrastrar.", icon: "🌧️" },
    { title: "Camino del cohete", description: "Traza una línea larga sin levantar el dedo.", icon: "🚀" },
  ];

  const day = new Date().toISOString().slice(0, 10);
  const seed = day.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return challenges[seed % challenges.length];
}

export function progressPct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}
