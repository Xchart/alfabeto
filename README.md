# Chispa

Plataforma educativa para aprender a escribir letras y números, diseñada para usuarios en etapa de pre-lectoescritura.

## Demo

🔗 [xchart.github.io/chispa](https://xchart.github.io/chispa/)

## Apps

### Letras (A-Z + Ñ)
- 27 letras del alfabeto español
- Animación de trazos con orden educativo correcto y colores por trazo
- Reconocimiento CNN on-device (EMNIST Letters, 93.78% accuracy)

### Números (0-9)
- 10 dígitos con trazos SVG educativos
- Reconocimiento CNN on-device (MNIST, 99.11% accuracy)

### Características compartidas
- **Modo Calca** — marca de agua de la letra/número como guía visual
- **Modo Libre** — practicar sin guía
- **Validación en tiempo real** al soltar el dedo, con indicador visual dinámico
- **Borde inteligente** del canvas que cambia de color según el estado de reconocimiento
- **Feedback por voz** (Web Speech API) con refuerzo positivo basado en *process praise*
- **Botón unificado** con 3 estados: 💡 (tip) → dígito/letra? (resultado) → ⭐ (éxito)
- **100% estático** — funciona sin servidor, desplegable en GitHub Pages

## Stack

- **Next.js 16** con export estático (`output: "export"`)
- **TensorFlow.js** para inferencia CNN en el navegador
- **Web Speech API** para TTS
- **TypeScript** + React

## Modelos CNN

| Modelo | Dataset | Accuracy | Clases | Pesos |
|--------|---------|----------|--------|-------|
| Letras | EMNIST Letters (~125K) | 93.78% | 26 (A-Z) | 404 KB |
| Dígitos | MNIST (60K) | 99.11% | 10 (0-9) | 410 KB |

**Arquitectura:** 3×Conv2D + BatchNorm + GlobalAvgPool + Dense

### Tolerancia
- Acepta top-1 o top-2 del modelo (confianza > 15%)
- Preprocesamiento con normalización de aspect ratio y centrado por bounding box
- Trazo grueso proporcional al canvas para mejor reconocimiento

## Pedagogía

El sistema de feedback sigue las recomendaciones de:

- **Carol Dweck (Stanford):** *Process Praise* — elogiar esfuerzo, estrategia y progreso; nunca habilidad innata ni identidad
- **Gunderson et al. (2018):** El tipo de elogio temprano predice rendimiento académico posterior
- **KQED/MindShift:** Para preescolares, frases descriptivas sobre lo que hicieron

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
├── page.tsx                    # Home (selector de apps)
├── globals.css                 # Estilos globales
├── components/
│   └── VersionLabel.tsx        # Label de versión (lee package.json)
├── letras/
│   └── page.tsx                # App de letras
├── numeros/
│   └── page.tsx                # App de números
└── lib/
    ├── letterValidator.ts      # CNN para letras (EMNIST)
    ├── numberValidator.ts      # CNN para dígitos (MNIST)
    └── writingCoach.ts         # Feedback pedagógico (process praise)
public/
├── model/                      # Pesos CNN letras
│   ├── group1-shard1of1.bin
│   └── weights_spec.json
└── model-digits/               # Pesos CNN dígitos
    ├── group1-shard1of1.bin
    └── weights_spec.json
scripts/
├── train_model.py              # Entrenamiento EMNIST Letters
└── train_digits_model.py       # Entrenamiento MNIST Digits
```

## Versionado

La versión actual se muestra en la esquina inferior derecha de todas las pantallas. Se lee automáticamente de `package.json`.

## Roadmap

- [x] Home con selector de apps
- [x] App de letras (A-Z + Ñ) con CNN
- [x] App de números (0-9) con CNN
- [x] Modo Calca / Libre
- [x] Feedback basado en process praise
- [x] Versionado con label visible
- [ ] Práctica guiada por trazo (seguir el camino exacto)
- [ ] Progreso local por letra/número (localStorage)
- [ ] Sílabas y palabras completas
- [ ] Gamificación ligera (rachas, estrellas por esfuerzo)
- [ ] Reentrenamiento con escritura infantil real

## Licencia

MIT
