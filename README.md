# Alfabeto

Aplicación educativa para aprender a escribir el alfabeto español, diseñada para usuarios en etapa de pre-lectoescritura.

## Demo

🔗 [xchart.github.io/alfabeto](https://xchart.github.io/alfabeto/)

## Características

- **27 letras** del alfabeto español (A-Z + Ñ)
- **Animación de trazos** con orden educativo correcto y colores por trazo
- **Modo Calca** con marca de agua de la letra como guía visual
- **Modo Libre** para practicar sin guía
- **Reconocimiento de escritura on-device** con red neuronal CNN (TensorFlow.js)
- **Feedback por voz** (Web Speech API) con refuerzo positivo basado en *process praise*
- **Validación en tiempo real** al soltar el dedo, con indicador visual dinámico
- **Borde inteligente** del canvas que cambia de color según el estado de reconocimiento
- **100% estático** — funciona sin servidor, desplegable en GitHub Pages

## Stack

- **Next.js 16** con export estático (`output: "export"`)
- **TensorFlow.js** para inferencia CNN en el navegador
- **Web Speech API** para TTS
- **TypeScript** + React

## Modelo CNN

Entrenado con el dataset [EMNIST Letters](https://www.nist.gov/itl/products-and-services/emnist-dataset) (~125,000 letras manuscritas reales).

| Métrica | Valor |
|---------|-------|
| Accuracy (test) | 93.78% |
| Arquitectura | 3×Conv2D + BatchNorm + GlobalAvgPool + Dense |
| Tamaño de pesos | 404 KB |
| Inferencia | On-device (navegador) |

### Tolerancia

- Acepta top-1 o top-2 del modelo (confianza > 15%)
- Preprocesamiento con normalización de aspect ratio y centrado por bounding box
- Trazo grueso proporcional al canvas para mejor reconocimiento

## Pedagogía

El sistema de feedback sigue las recomendaciones de:

- **Carol Dweck (Stanford):** *Process Praise* — elogiar esfuerzo, estrategia y progreso; nunca habilidad innata ni identidad
- **Gunderson et al. (2018):** El tipo de elogio temprano predice rendimiento académico posterior
- **KQED/MindShift:** Para preescolares, frases descriptivas sobre lo que hicieron

### Ejemplos

| ✅ Correcto | ❌ Evitado |
|-------------|-----------|
| "Se nota que te esforzaste en cada trazo" | "Eres el mejor" |
| "Cada vez que practicas, tu trazo mejora" | "Qué listo eres" |
| "Tu esfuerzo se nota" | "Perfecto" |

## Desarrollo local

```bash
npm install
npm run dev
```

## Build estático

```bash
npm run build
# Output en ./out/
npx serve out
```

## Deploy

El proyecto se despliega automáticamente en GitHub Pages vía GitHub Actions en cada push a `main`.

## Estructura

```
src/app/
├── page.tsx              # Componente principal (UI unificada)
├── globals.css           # Estilos
├── lib/
│   ├── letterValidator.ts  # Modelo CNN + preprocesamiento
│   └── writingCoach.ts     # Feedback pedagógico (process praise)
public/model/
├── group1-shard1of1.bin  # Pesos del modelo CNN
├── model.json            # Topología Keras
└── weights_spec.json     # Especificación de tensores
scripts/
└── train_model.py        # Script de entrenamiento EMNIST
```

## Roadmap

- [ ] Práctica guiada por trazo (seguir el camino exacto)
- [ ] Progreso local por letra (localStorage)
- [ ] Sílabas y palabras completas
- [ ] Gamificación ligera (rachas, estrellas por esfuerzo)
- [ ] Reentrenamiento con escritura infantil real

## Licencia

MIT
