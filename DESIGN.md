# Design System: Chispa

**Project ID:** local-nextjs-alfabeto
**Base:** Next.js app `projects/alfabeto`, version 0.4.0

## 1. Visual Theme & Atmosphere
Chispa ya vive en una atmósfera pastel, amable y educativa: cálida, suave, juguetona y de baja fricción. La interfaz actual comunica seguridad para niñas y niños pequeños mediante fondos degradados, tarjetas blancas translúcidas, esquinas muy redondeadas y sombras suaves.

La evolución recomendada debe mantener esa calma, pero elevarla de “demo funcional” a “producto infantil premium”: más narrativa visual, jerarquía clara, estados de progreso más expresivos y pantallas de práctica con guía pedagógica más evidente.

## 2. Color Palette & Roles
- **Luz Crema de Inicio (#fff1c9):** fondo cálido principal; transmite cercanía y baja ansiedad.
- **Rosa Algodón (#ffd1dd):** zona emocional del degradado; refuerza juego y ternura.
- **Cielo Suave (#c8ecff):** cierre fresco del fondo; da aire y limpieza visual.
- **Morado Tinta Chispa (#2e2452):** texto principal y títulos; legible sin sentirse adulto o rígido.
- **Lavanda Serena (#6f5b95):** texto secundario, captions y metadatos de progreso.
- **Violeta Trazos (#8b5cf6):** módulo de grafomotricidad; energía creativa/manual.
- **Azul Letras (#3b82f6):** módulo de letras; claridad, estructura y aprendizaje.
- **Verde Números (#10b981):** módulo de números; avance, acierto y confianza.
- **Ámbar Reto (#f59e0b):** retos, logros parciales y llamadas de atención positivas.
- **Rojo Suave de Corrección (#ef4444):** errores o baja confianza; usar con moderación y tono no punitivo.

## 3. Typography Rules
La base actual usa `Trebuchet MS` y `Segoe UI`, con un carácter amable y legible. Para una evolución más premium, mantener una sans redondeada de alta legibilidad infantil: títulos con peso 800–900, subtítulos 600–700 y microcopy 500–700. Evitar tipografías demasiado decorativas en instrucciones.

Regla clave: tipografía grande, pocas líneas, mensajes directos y elogio de proceso. La pantalla debe poder entenderse a distancia y con interacción táctil rápida.

## 4. Component Stylings
* **Buttons:** Formas tipo píldora o círculos grandes. Primarios con color semántico por módulo; secundarios blancos translúcidos. Estados activos deben sentirse táctiles: pequeño lift, sombra suave y escala mínima al tocar.
* **Cards/Containers:** Tarjetas blancas con transparencia 84–92%, esquinas generosas de 20–28px, borde blanco sutil y sombra difusa. Deben parecer piezas blandas y seguras, no paneles técnicos.
* **Inputs/Canvas:** El canvas debe ser el centro emocional de la práctica: blanco limpio, marco con color de estado, guía tenue y botones flotantes grandes. La corrección debe orientar, no castigar.
* **Progress:** Barras tipo píldora, anillos o caminos visuales. El avance debe comunicar “siguiente paso” más que porcentaje frío.
* **Mascot/Illustration:** Recomendado introducir una pequeña “chispa” guía: no protagonista invasiva, sino acompañante que aparece en retos, felicitaciones y tips.

## 5. Layout Principles
Mobile-first, ancho máximo cercano a 440–460px. Espaciado compacto pero respirable. La home debe responder tres preguntas: qué hice, qué sigue y dónde entro. Las pantallas de práctica deben agrupar navegación, modo, canvas, feedback y acciones sin competir visualmente.

## 6. Proposed Direction A — Chispa Studio
**Idea:** evolución directa del diseño actual. Dashboard cálido, premium, con tarjetas grandes, mascot pequeño y práctica más ordenada.

**Mejor para:** implementar rápido, menor riesgo, mantiene continuidad visual.

**Cambios sustanciales:**
- Hero más emocional con mascot “chispa”.
- Progreso con tarjetas más claras y CTA de “continuar”.
- Cards de módulos con más profundidad, iconos consistentes y microcopy pedagógico.
- Pantalla de práctica con panel de instrucciones superior, canvas más protagonista y feedback fijo abajo.

## 7. Proposed Direction B — Chispa Aventura
**Idea:** rediseño más ambicioso tipo mapa de aprendizaje. El progreso se vuelve una ruta narrativa: trazos base → letras → números → retos.

**Mejor para:** diferenciar producto, aumentar motivación y retención, introducir progresión pedagógica.

**Cambios sustanciales:**
- Home como mapa vertical de camino/islas.
- Reto diario como estación del camino.
- Badges/estrellas integrados visualmente.
- Canvas de práctica reinterpretado como “seguir el camino”, ideal para grafomotricidad.
- Mayor potencial para niveles, desbloqueos y sílabas/palabras después.

## 8. Recommendation
Recomiendo implementar **Versión A primero** como fase de bajo riesgo y usar elementos de **Versión B** para la siguiente fase pedagógica: mapa de progreso y narrativa de aventura.

Ruta sugerida:
1. Crear tokens visuales y componentes base.
2. Rediseñar Home con estructura de Versión A.
3. Rediseñar pantalla de práctica con canvas y feedback más claros.
4. Incorporar mapa/progresión de Versión B cuando se agreguen sílabas, palabras o niveles.
