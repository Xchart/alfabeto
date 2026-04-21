import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const DEMO_KEY = "chispa-demo-seen";

export function hasSeenDemo(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DEMO_KEY) === "true";
}

export function markDemoSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_KEY, "true");
}

function createDriver(steps: any[]) {
  return driver({
    showProgress: true,
    allowClose: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Listo",
    steps,
    onDestroyed: () => {
      markDemoSeen();
    },
  });
}

export function runHomeDemo() {
  if (typeof window === "undefined") return;

  const tour = createDriver([
    {
      element: "[data-demo='title']",
      popover: {
        title: "Bienvenido a Chispa",
        description: "Aquí eliges qué quieres practicar. Chispa está pensada para aprender jugando.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-demo='letras']",
      popover: {
        title: "Modo Letras",
        description: "Aquí practicas letras del alfabeto con guía visual, validación y retroalimentación.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-demo='numeros']",
      popover: {
        title: "Modo Números",
        description: "Aquí practicas números con la misma dinámica de trazo, verificación y ayuda.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-demo='demo-button']",
      popover: {
        title: "Volver a ver el demo",
        description: "Puedes tocar este botón cuando quieras para volver a mostrar esta guía.",
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-demo='version']",
      popover: {
        title: "Versión actual",
        description: "Aquí puedes ver qué versión de Chispa estás usando.",
        side: "top",
        align: "center",
      },
    },
  ]);

  tour.drive();
}

export function runLettersDemo() {
  if (typeof window === "undefined") return;
  const tour = createDriver([
    { element: "[data-demo='letters-demo-button']", popover: { title: "Demo", description: "Puedes volver a abrir esta guía cuando quieras.", side: "bottom", align: "center" } },
    { element: "[data-demo='letters-symbol']", popover: { title: "Letra actual", description: "Aquí ves la letra que toca practicar.", side: "bottom", align: "center" } },
    { element: "[data-demo='letters-prev']", popover: { title: "Navegación", description: "Usa estas flechas para cambiar de letra.", side: "bottom", align: "center" } },
    { element: "[data-demo='letters-animation']", popover: { title: "Animación", description: "Aquí puedes ver cómo se forma la letra antes de intentarla.", side: "bottom", align: "center" } },
    { element: "[data-demo='letters-mode']", popover: { title: "Modo de práctica", description: "Puedes alternar entre Calca y Libre según cómo quieras practicar.", side: "bottom", align: "center" } },
    { element: "[data-demo='letters-canvas']", popover: { title: "Zona para dibujar", description: "Aquí trazas la letra con tu dedo y luego puedes verificarla.", side: "top", align: "center" } },
    { element: "[data-demo='letters-clear']", popover: { title: "Borrar", description: "Si quieres empezar de nuevo, usa este botón.", side: "bottom", align: "center" } },
    { element: "[data-demo='letters-hint']", popover: { title: "Ayuda o verificación", description: "Este botón te da una pista o verifica tu intento, según el estado actual.", side: "left", align: "center" } },
  ]);
  tour.drive();
}

export function runNumbersDemo() {
  if (typeof window === "undefined") return;
  const tour = createDriver([
    { element: "[data-demo='numbers-demo-button']", popover: { title: "Demo", description: "Puedes volver a abrir esta guía cuando quieras.", side: "bottom", align: "center" } },
    { element: "[data-demo='numbers-symbol']", popover: { title: "Número actual", description: "Aquí ves el número que toca practicar.", side: "bottom", align: "center" } },
    { element: "[data-demo='numbers-prev']", popover: { title: "Navegación", description: "Usa estas flechas para cambiar de número.", side: "bottom", align: "center" } },
    { element: "[data-demo='numbers-animation']", popover: { title: "Animación", description: "Aquí ves una referencia visual del número antes de dibujarlo.", side: "bottom", align: "center" } },
    { element: "[data-demo='numbers-mode']", popover: { title: "Modo de práctica", description: "Puedes cambiar entre Calca y Libre según el tipo de práctica.", side: "bottom", align: "center" } },
    { element: "[data-demo='numbers-canvas']", popover: { title: "Zona para dibujar", description: "Aquí dibujas el número con tu dedo y luego puedes verificarlo.", side: "top", align: "center" } },
    { element: "[data-demo='numbers-clear']", popover: { title: "Borrar", description: "Este botón limpia el trazo para volver a empezar.", side: "bottom", align: "center" } },
    { element: "[data-demo='numbers-hint']", popover: { title: "Ayuda o verificación", description: "Aquí obtienes una pista o verificas tu intento, según lo que ya hiciste.", side: "left", align: "center" } },
  ]);
  tour.drive();
}
