"use client";

import { posthog } from "../components/PostHogProvider";

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  try {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.capture(event, properties);
  } catch {
    // no-op
  }
}
