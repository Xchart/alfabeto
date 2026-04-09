# Plan de mejora, Proyecto Alfabeto

Estado base evaluado: app estática funcional con:
- visualización unificada de letra
- animación de trazos
- canvas de escritura
- validación CNN con EMNIST
- TTS de letra y feedback
- deploy estático en GitHub Pages

Objetivo de esta propuesta:
Mejorar precisión, claridad visual, robustez móvil y valor pedagógico, sin degradar simplicidad.

---

## Iteración 1, Diagnóstico

### Fortalezas actuales
1. Flujo simple en una sola pantalla.
2. Reconocimiento on-device sin backend.
3. Interacción táctil rápida.
4. Deploy estático viable.

### Problemas detectados
1. La validación aún puede sentirse rígida o inconsistente según tamaño/proporción del trazo.
2. La barra de precisión existe, pero no siempre aporta información pedagógica clara.
3. El feedback mezcla validación, coaching y UX, a veces sin distinguir qué falló.
4. El canvas sigue siendo libre, pero no guía suficientemente el tamaño, zona útil o dirección esperada.
5. No hay memoria de progreso por letra.

---

## Iteración 2, Opciones de mejora

### Opción A, Mejorar solo UX
- guías visuales más claras en canvas
- barra de progreso más explícita
- mejor feedback textual
- sin tocar modelo

**Ventaja:** rápida de implementar
**Riesgo:** no resuelve del todo la percepción de rigidez

### Opción B, Mejorar preprocesamiento + UX
- normalización más robusta del dibujo
- zona segura de escritura
- visualización de confianza/predicción secundaria
- separación entre score técnico y consejo pedagógico

**Ventaja:** mejora real sin cambiar arquitectura
**Riesgo:** requiere ajustes finos y pruebas locales

### Opción C, Reentrenar o cambiar modelo
- dataset adicional
- letras infantiles/variantes
- modelo más tolerante

**Ventaja:** potencial de mayor precisión
**Riesgo:** más tiempo, más complejidad, más iteración experimental

---

## Iteración 3, Propuesta óptima recomendada

Recomiendo **Opción B** como siguiente fase.

Porque:
- mantiene la simplicidad del producto
- mejora la precisión percibida sin sobrecargar el proyecto
- sigue siendo compatible con hosting estático
- da margen para una futura fase C solo si todavía hace falta

---

# Propuesta óptima, Fase siguiente

## 1. Mejoras de validación

### 1.1 Normalización visual más robusta
- recortar bounding box con margen dinámico
- centrar por masa visual, no solo por extremos
- normalizar grosor/trazo antes de inferencia
- agregar umbral de contenido mínimo para evitar falsos positivos en garabatos pequeños

### 1.2 Score más interpretable
Separar:
- **Confianza del modelo**
- **Similitud pedagógica**
- **Resultado final**

Ejemplo:
- "Parece una A"
- "Buen tamaño"
- "Falta cerrar el trazo derecho"

### 1.3 Heurística híbrida
Combinar CNN + reglas simples:
- ocupación mínima del canvas
- proporción alto/ancho
- posición del dibujo
- número aproximado de segmentos o continuidad

Esto evita que el modelo acepte demasiado garabato o rechace dibujos razonables.

---

## 2. Mejoras de UX en canvas

### 2.1 Zona guía de escritura
Agregar una guía visual tenue dentro del canvas:
- caja objetivo donde debería vivir la letra
- líneas base opcionales (arriba/medio/abajo)

Esto mejora el trazo y también mejora el input al modelo.

### 2.2 Barra de progreso rediseñada
Cambiarla a:
- porcentaje visible
- etiqueta textual corta: "intento", "va bien", "casi", "correcta"
- actualización solo al terminar el trazo, no cada micro-movimiento

### 2.3 Estado de validación más claro
- si no hay suficiente contenido: "Dibuja un poco más"
- si parece otra letra: mostrar cuál detectó
- si va bien pero incompleta: mostrar sugerencia concreta

---

## 3. Mejoras pedagógicas

### 3.1 Modo práctica guiada
Antes del canvas libre:
- seguir el trazo sobre guía
- luego intentarlo sola/o

### 3.2 Refuerzo positivo por letra
- primera vez correcta
- racha de letras correctas
- repetición inteligente de letras difíciles

### 3.3 Progreso local
Guardar en localStorage:
- letras practicadas
- mejores scores
- letras con más dificultad

---

## 4. Mejoras técnicas

### 4.1 Separar responsabilidades
Refactor sugerido:
- `letterValidator.ts` → inferencia y normalización
- `writingCoach.ts` → feedback pedagógico
- `drawingMetrics.ts` → heurísticas geométricas
- `speech.ts` → voz/TTS

### 4.2 Instrumentación local opcional
Modo debug local:
- ver imagen 28x28 procesada
- ver top-3 predicciones del modelo
- ver score heurístico

Esto sería clave para iterar mañana en local.

### 4.3 Ajuste de assets para Pages
- mantener compatibilidad con basePath
- validar fetch del modelo en local y Pages

---

# Orden recomendado de implementación

## Fase 1, Alta prioridad
1. Rediseñar barra/estado de validación
2. Añadir zona guía dentro del canvas
3. Mejorar preprocesamiento y umbral mínimo de contenido
4. Introducir validación híbrida CNN + heurística ligera

## Fase 2, Media prioridad
5. Guardar progreso local por letra
6. Mejorar feedback pedagógico por tipo de error
7. Agregar modo debug local opcional

## Fase 3, Opcional posterior
8. Reentrenar modelo con datos más cercanos a escritura infantil
9. Agregar práctica guiada por trazo
10. Gamificación ligera

---

# Criterio de éxito

La siguiente versión debería lograr:
- menos rechazos injustos
- menos aceptaciones de garabatos
- feedback más claro y explicable
- mejor uso del espacio del canvas
- mejor experiencia móvil

---

# Rama de trabajo

Se creó la rama:
- `feature/plan-mejoras-local`

Restricción cumplida:
- no se trabajará directamente sobre `main`
- la revisión se hará primero en local

---

# Recomendación para mañana

Mañana conviene arrancar por este orden:
1. activar modo debug local de validación
2. rediseñar barra + estado textual
3. agregar caja guía dentro del canvas
4. ajustar validación híbrida

Con eso podremos revisar localmente si la percepción mejora antes de seguir con cambios más profundos.
