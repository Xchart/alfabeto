# Changelog

## v0.4.0 — Grafomotricidad y progreso local

### Agregado
- Nuevo módulo **Trazos** para grafomotricidad inicial.
- Actividades iniciales: ola, montaña, círculo y zigzag.
- Modo **Guía / Libre** para trazos.
- Progreso local con `localStorage` para Trazos, Letras y Números.
- Home rediseñada con racha, estrellas, reto del día y avance por módulo.
- Validación de Trazos por cobertura de camino en modo guía.

### Mejorado
- Letras y Números ahora registran progreso cuando la validación en vivo detecta éxito o cuando se verifica manualmente.
- Home refresca progreso al volver, recuperar foco, cambiar visibilidad o recibir evento interno de progreso.

### Notas
- Se mantiene arquitectura estática/PWA sin backend.
- El progreso es local al dispositivo.
