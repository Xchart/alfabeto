# Plan de mejora — Chispa

Estado base actual evaluado:
- app estática funcional en GitHub Pages
- Home con selector de apps
- módulo de **Letras**
- módulo de **Números**
- validación on-device
- TTS y feedback
- demo overlay inicial
- branch de analytics con PostHog cloud

Objetivo de esta propuesta:
Llevar Chispa de una demo funcional a un producto educativo más pulido, consistente y medible, mejorando interfaz, pedagogía, progresión y claridad visual sin perder simplicidad operativa.

---

## Fundamento pedagógico actualizado — grafomotricidad

Referencia principal solicitada:
- Faber-Castell, “Desarrollar la caligrafía con la motricidad lúdica (escritura)”  
  https://www.faber-castell.com.mx/tutorials/children/learning-to-write/developing-handwriting

Ideas clave que deben orientar Chispa:

1. **Antes de escribir letras precisas, el niño necesita dominar movimientos.**
   La escritura se apoya en motricidad gruesa, motricidad fina, coordinación ojo-mano, control espacial y automatización de secuencias.

2. **Las letras inicialmente se dibujan, se deforman o incluso se invierten.**
   En etapa preescolar esto es normal. Chispa no debe castigar demasiado la forma exacta en etapas tempranas.

3. **La práctica intensa de letras perfectas no siempre ayuda.**
   Puede generar tensión, frustración y dificultades de concentración. Es mejor trabajar patrones de movimiento.

4. **La grafomotricidad debe entrenar trazos base.**
   Líneas rectas, curvas, arcos, puntos, cambios de dirección, trazos ascendentes/descendentes, inclinaciones y puntos de inicio.

5. **La fluidez importa tanto como la forma.**
   Una escritura correcta y legible surge de combinar control de forma con movimientos fluidos y automatizados.

6. **El juego corporal y sensorial prepara la escritura.**
   Trazar en grande, mover en el aire, seguir caminos, dibujar sobre superficies, coordinar ritmo y movimiento son actividades relevantes.

7. **La app debe evitar una lógica de “correcto/incorrecto” demasiado rígida.**
   Debe orientar, motivar y proponer movimiento siguiente, no solo validar con CNN.

Implicación directa para Chispa:
Chispa no debería ser solo una app de “reconocimiento de letras y números”. Debe evolucionar hacia una app de **preescritura y grafomotricidad guiada**, donde letras y números sean una consecuencia natural de practicar movimientos base.

---

## Referencia visual de producto

Referencia recibida para inspiración de UX/UI:
- `docs/referencias/chispa-ui-referencia-2026-04-21.jpg` (mockup tipo app educativa infantil con home de progreso + pantalla de práctica)

Qué rescatar de esa referencia:
1. Home con progreso visible
2. Cards grandes y amigables
3. Sentido de avance (racha, estrellas, reto del día)
4. Pantalla de práctica con acciones bien agrupadas
5. Feedback visual más cálido y más producto

**Nota:** usarla como inspiración de dirección visual y producto, no como copia literal.

---

## Diagnóstico actual

### Fortalezas actuales
1. Base técnica ya funcional y desplegada.
2. Arquitectura simple, estática y mantenible.
3. Letras y números ya están separados como módulos claros.
4. Existe una primera capa de onboarding (demo overlay).
5. Ya hay intención de instrumentación con analytics.

### Problemas detectados
1. La UI todavía se siente más “demo técnica” que “producto infantil pulido”.
2. El sistema visual no está unificado como design system.
3. La home aún comunica función, pero no progreso ni retorno.
4. La experiencia de práctica todavía puede mejorar en jerarquía visual y agrupación de acciones.
5. El feedback pedagógico ya mejoró, pero necesita más consistencia y expresividad controlada.
6. Falta progreso local visible y una capa simple de gamificación.
7. Analytics aún no está consolidado en producción.
8. El plan todavía prioriza letra/número como objetivo final, pero no suficientemente los patrones grafomotores previos.
9. Falta una progresión pedagógica: movimiento libre → trazo base → forma guiada → letra/número → fluidez.
10. La validación actual puede reforzar perfeccionismo visual cuando debería reforzar control, dirección, tamaño, continuidad y relajación.

---

## Propuesta óptima recomendada

La siguiente fase no debería centrarse primero en más features sueltas, sino en tres líneas integradas:

### Línea A — Sistema visual y producto
Crear una base de UI consistente, reusable y más atractiva.

### Línea B — Progreso y motivación
Hacer visible el avance para que la app tenga retorno y retención.

### Línea C — Instrumentación y aprendizaje del uso
Medir qué usan, cómo lo usan y dónde fricciona la experiencia.

### Línea D — Grafomotricidad y progresión pedagógica
Diseñar Chispa como experiencia de preescritura: primero movimientos base, luego letras y números.

---

# Plan actualizado de ejecución

## Fase 1 — Sistema visual base (alta prioridad)

### 1.1 Definir stack visual
Recomendación actual:
- **shadcn/ui + Radix UI** para primitives y componentes
- **Framer Motion** para microinteracciones
- **Lucide** para iconografía base
- **Driver.js** para onboarding
- **Lottie** o SVG ligeros para celebraciones

### 1.2 Crear design system mínimo
Componentes base:
- card principal
- card secundaria
- progress bar
- badge
- streak chip
- action button primario/secundario
- feedback card
- top toolbar consistente

### 1.3 Definir línea visual
- paleta principal de Chispa
- espaciado
- radios
- sombras
- tipografía
- iconografía
- estilo de ilustración

**Criterio de éxito:** que Home, Letras y Números compartan un lenguaje visual claro y consistente.

---

## Fase 2 — Rediseño de Home (alta prioridad)

### 2.1 Nueva estructura de Home
Agregar bloques como:
- saludo / identidad
- progreso de letras
- progreso de números
- streak / estrellas
- reto del día
- acceso a apps mediante cards grandes

### 2.2 Retorno visual
La home debe responder a la pregunta:
- “¿Qué he hecho?”
- “¿Qué sigue?”
- “¿Qué puedo abrir ahora?”

### 2.3 Demo y onboarding
- mantener autoplay solo primera vez
- replay manual claro
- integrar onboarding con narrativa más producto

**Criterio de éxito:** que la home ya no sea solo un launcher, sino el centro del producto.

---

## Fase 3 — Rediseño de pantallas de práctica (alta prioridad)

### 3.1 Reorganización de acciones
Separar mejor:
- navegación
- escuchar / repetir
- demo / ayuda
- modos de práctica
- canvas
- feedback

### 3.2 Canvas más pedagógico
- guías visuales más limpias
- mejor agrupación de acciones sobre el canvas
- feedback visual más claro
- CTA de ayuda/verificación más entendible

### 3.3 Feedback card rediseñada
Mostrar:
- mensaje motivacional breve
- orientación concreta
- estado visual consistente

**Criterio de éxito:** que practicar se sienta claro, agradable y guiado, no solo funcional.

---

## Fase 4 — Módulo de grafomotricidad (alta prioridad pedagógica)

Esta fase debe existir antes de profundizar en gamificación, porque define la calidad educativa de Chispa.

### 4.1 Trazos base antes de letras
Agregar una nueva ruta o modo:
- líneas verticales
- líneas horizontales
- diagonales
- curvas
- arcos
- círculos
- espirales
- ondas
- zigzag
- puntos
- cambios de dirección

Objetivo: que el niño practique movimientos necesarios para escribir sin exigir todavía una letra perfecta.

### 4.2 Secuencia pedagógica recomendada
Cada actividad debería seguir este orden:
1. **Mira** — animación clara del movimiento
2. **Haz grande** — trazo amplio y libre
3. **Sigue la guía** — calca con apoyo visual
4. **Intenta libre** — sin guía
5. **Recibe orientación** — feedback sobre movimiento, no identidad

### 4.3 Métricas grafomotoras
Medir y retroalimentar:
- continuidad del trazo
- tamaño relativo
- centrado
- dirección aproximada
- cobertura del camino
- suavidad / exceso de quiebres
- inicio y fin aproximados

No enfocarse solo en:
- si “parece” una letra
- score CNN
- perfección visual

### 4.4 Feedback alineado a grafomotricidad
Ejemplos de feedback deseado:
- “Buen esfuerzo. Ahora intenta hacerlo más grande y lento.”
- “Vas bien. Sigue la curva sin levantar tanto el dedo.”
- “Prueba empezar arriba y bajar con calma.”
- “Tu trazo ya sigue el camino. Ahora intenta hacerlo más continuo.”

Evitar:
- “Está mal”
- “No parece una A” como mensaje principal
- “Perfecto”
- “Eres muy inteligente”

### 4.5 Actividades sensoriales traducidas a app
Inspiradas en grafomotricidad:
- “dibuja una ola”
- “sigue el camino del cohete”
- “lleva la mariposa por la curva”
- “haz gotas de lluvia”
- “sube y baja la montaña”

Estas actividades pueden usar metáforas visuales antes de presentar letras.

**Criterio de éxito:** que Chispa enseñe movimientos de escritura, no solo reconozca caracteres.

---

## Fase 5 — Progreso local y gamificación ligera (media prioridad)

### 5.1 Progreso local
Guardar en localStorage:
- letras completadas
- números completados
- trazos base completados
- mejores resultados
- fecha de último uso
- streak simple

### 5.2 Señales de motivación
- estrellas
- progreso visible
- reto del día
- celebraciones pequeñas
- badges ligeros

### 5.3 Repetición inteligente simple
- sugerir letras o números menos trabajados
- sugerir trazos base débiles
- destacar “continúa donde te quedaste”

**Criterio de éxito:** que el usuario perciba avance acumulado y tenga razones para volver.

---

## Fase 6 — Analytics de producto (media prioridad)

### 6.1 Consolidar PostHog
Eventos recomendados:
- `home_view`
- `demo_auto_started`
- `demo_replayed`
- `app_opened`
- `navigation_clicked`
- `mode_changed`
- `canvas_cleared`
- `hint_or_verify_clicked`
- `practice_completed`
- `graphomotor_trace_started`
- `graphomotor_trace_completed`
- `graphomotor_guidance_shown`
- `streak_seen`
- `daily_challenge_seen`

### 6.2 Preguntas que debe responder analytics
- ¿Qué módulo abren más, Letras o Números?
- ¿Cuánto usan el demo?
- ¿Qué controles generan más interacción?
- ¿Se usa más Calca o Libre?
- ¿En qué parte se abandona la experiencia?
- ¿Qué trazos grafomotores cuestan más?
- ¿Los niños pasan de trazo base a letras con más facilidad?

### 6.3 Enfoque
Medir producto, no contenido sensible.

**Criterio de éxito:** que Chispa empiece a producir señales claras para priorizar mejoras reales.

---

## Fase 7 — Recursos visuales open source (media prioridad)

### 7.1 Curaduría recomendada
Usar una sola línea principal de recursos:
- **Open Doodles** o **unDraw** para ilustración base
- **Lucide** para iconos funcionales
- SVG propios o Lottie para recompensas ligeras

### 7.2 Qué recursos necesita Chispa
- ilustración de bienvenida
- iconos por app
- badges / recompensas
- estados vacíos
- reto del día
- progreso / logro
- rutas/caminos para trazos grafomotores
- personajes/objetos que recorran líneas, curvas y ondas

### 7.3 Regla
No mezclar demasiados estilos visuales.

**Criterio de éxito:** que la app tenga identidad visual coherente y reconocible.

---

## Fase 8 — Mejora pedagógica controlada (posterior)

### 8.1 Feedback híbrido más fino
- reglas determinísticas
- IA solo como refinador de tono
- más control por tipo de error

### 8.2 Tipos de ayuda
- motivación
- orientación geométrica
- repetición guiada
- sugerencia siguiente paso

### 8.3 Personalización futura
- letras o números difíciles
- secuencia sugerida
- práctica por nivel

**Criterio de éxito:** feedback más útil, más estable y más alineado a aprendizaje real.

---

# Orden recomendado de implementación

## Etapa inmediata
1. consolidar stack visual base
2. introducir módulo de grafomotricidad / trazos base
3. rediseñar Home como centro del producto
4. rediseñar práctica en Letras y Números con enfoque grafomotor
5. activar progreso local simple
6. consolidar analytics en producción

## Etapa siguiente
7. gamificación ligera
8. recursos visuales consistentes
9. feedback pedagógico más refinado

---

# Criterio de éxito general

La siguiente gran versión de Chispa debería lograr:
- verse como producto, no solo como demo
- comunicar progreso con claridad
- dar motivación visible al usuario
- tener una práctica más limpia y agradable
- enseñar movimientos base de preescritura
- reducir presión por “letra perfecta”
- reforzar control, continuidad, dirección y fluidez
- empezar a generar datos útiles de uso
- sostener una identidad visual propia

---

# Recomendación de rama siguiente

Rama sugerida para arrancar esta fase:
- `feature/ui-system-and-resources`

---

# Recomendación para la siguiente sesión

Arrancar por este orden:
1. definir stack visual final
2. decidir set de recursos visuales base
3. definir progresión grafomotora mínima
4. rediseñar Home
5. mover ese nuevo lenguaje visual a Letras/Números
6. crear primer módulo de trazos base
7. luego sumar progreso local y analytics en producción

---

# Progresión pedagógica propuesta para Chispa

## Nivel 0 — Juego motor visual
Actividades sin letras:
- líneas
- curvas
- ondas
- círculos
- caminos

Meta: control, dirección y coordinación.

## Nivel 1 — Pretrazos guiados
Actividades con guía visual:
- sigue el camino
- completa la curva
- une puntos
- sube/baja montañas

Meta: automatizar secuencias de movimiento.

## Nivel 2 — Letras y números en modo Calca
El niño practica símbolos reales con apoyo visual.

Meta: conectar movimientos base con formas reconocibles.

## Nivel 3 — Letras y números en modo Libre
El niño intenta sin guía.

Meta: autonomía y control.

## Nivel 4 — Fluidez y repetición inteligente
La app sugiere repetir movimientos o símbolos con dificultad.

Meta: reforzar sin frustrar.
