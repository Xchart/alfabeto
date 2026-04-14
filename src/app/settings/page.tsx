"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isWebGPUSupported,
  isModelCached,
  initGemma,
  clearModelCache,
  isGemmaReady,
  type GemmaState,
} from "../lib/gemmaService";
import VersionLabel from "../components/VersionLabel";

export default function SettingsPage() {
  const [gemmaEnabled, setGemmaEnabled] = useState(false);
  const [gemmaState, setGemmaState] = useState<GemmaState>({ status: "idle", progress: 0 });
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    const supported = isWebGPUSupported();
    setWebgpuSupported(supported);

    // Leer preferencia
    const saved = localStorage.getItem("chispa-gemma-enabled");
    if (saved === "true" && supported) {
      setGemmaEnabled(true);
    }

    // Verificar cache
    isModelCached().then(setCached);
  }, []);

  const handleToggle = useCallback(async () => {
    if (gemmaEnabled) {
      // Desactivar
      setGemmaEnabled(false);
      localStorage.setItem("chispa-gemma-enabled", "false");
      return;
    }

    // Activar: iniciar descarga/carga
    setGemmaEnabled(true);
    localStorage.setItem("chispa-gemma-enabled", "true");

    await initGemma((state) => {
      setGemmaState(state);
      if (state.status === "ready") {
        setCached(true);
      }
    });
  }, [gemmaEnabled]);

  const handleClearCache = async () => {
    await clearModelCache();
    setCached(false);
    setGemmaEnabled(false);
    localStorage.setItem("chispa-gemma-enabled", "false");
    setGemmaState({ status: "idle", progress: 0 });
  };

  const statusLabel: Record<string, string> = {
    idle: "",
    checking: "Verificando...",
    downloading: `Descargando modelo (${gemmaState.progress}%)`,
    loading: "Cargando modelo...",
    ready: "Modelo listo",
    error: gemmaState.error || "Error",
    unsupported: "No compatible",
  };

  return (
    <main className="mainContainer">
      <VersionLabel />
      <a href="/" className="homeBtn" aria-label="Inicio">🏠</a>
      <div className="container">
        <div className="settingsHeader">
          <h1 className="settingsTitle">Configuración</h1>
        </div>

        <div className="settingsSection">
          <div className="settingCard">
            <div className="settingInfo">
              <span className="settingIcon">🧠</span>
              <div>
                <h3 className="settingName">IA Local (Gemma)</h3>
                <p className="settingDesc">
                  Descarga un modelo de IA al dispositivo para feedback más inteligente y modo conversacional.
                  {!webgpuSupported && webgpuSupported !== null && (
                    <span className="settingWarning"> Tu navegador no soporta WebGPU.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="settingActions">
              <button
                type="button"
                className={`toggleBtn ${gemmaEnabled ? "is-on" : ""}`}
                onClick={handleToggle}
                disabled={!webgpuSupported || gemmaState.status === "downloading" || gemmaState.status === "loading"}
              >
                <span className="toggleKnob" />
              </button>
            </div>

            {gemmaState.status !== "idle" && (
              <div className="settingStatus">
                {gemmaState.status === "downloading" && (
                  <div className="downloadBar">
                    <div className="downloadFill" style={{ width: `${gemmaState.progress}%` }} />
                  </div>
                )}
                <span className={`statusText ${gemmaState.status === "ready" ? "is-ok" : gemmaState.status === "error" ? "is-err" : ""}`}>
                  {statusLabel[gemmaState.status]}
                </span>
              </div>
            )}

            {cached && (
              <button type="button" className="clearCacheBtn" onClick={handleClearCache}>
                Borrar modelo descargado
              </button>
            )}

            <div className="settingMeta">
              <span>Modelo: Gemma 4 E2B Web</span>
              <span>Tamaño: por validar</span>
              <span>Requiere: WebGPU (Chrome 113+)</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
