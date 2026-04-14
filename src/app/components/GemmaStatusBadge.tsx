"use client";

import { useEffect, useState } from "react";
import { initGemma, isGemmaEnabled, isGemmaReady, isModelCached, type GemmaState } from "../lib/gemmaService";

export default function GemmaStatusBadge() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<GemmaState>({ status: "idle", progress: 0 });

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (!isGemmaEnabled()) return;
      setVisible(true);

      if (isGemmaReady()) {
        if (mounted) setState({ status: "ready", progress: 100 });
        return;
      }

      const cached = await isModelCached();
      if (!cached) {
        if (mounted) setState({ status: "idle", progress: 0 });
        return;
      }

      await initGemma((next) => {
        if (mounted) setState(next);
      });
    };

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;

  const label =
    state.status === "ready"
      ? "IA local lista"
      : state.status === "loading" || state.status === "checking"
        ? "IA local cargando..."
        : state.status === "downloading"
          ? `IA local descargando ${state.progress}%`
          : state.status === "error"
            ? "IA local no disponible"
            : state.status === "unsupported"
              ? "IA local no compatible"
              : "IA local inactiva";

  const className =
    state.status === "ready"
      ? "gemmaBadge is-ready"
      : state.status === "error" || state.status === "unsupported"
        ? "gemmaBadge is-error"
        : "gemmaBadge";

  return (
    <div className={className} title={state.detail || state.error || ""}>
      <div>{label}</div>
      {(state.detail || state.error) && <div className="gemmaBadgeDetail">{state.detail || state.error}</div>}
    </div>
  );
}
