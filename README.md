# Alfabeto (Next.js)

Experiencia fullscreen, mobile-first, para recorrer el alfabeto español (incluyendo `Ñ`), con gestos, botones y pronunciación por voz en el navegador.

## Requisitos

- Node.js 20+
- npm

## Ejecutar en desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Ejecutar en producción

```bash
npm install
npm run build
npm run start
```

La app quedará disponible en `http://localhost:3000`.

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de producción
- `npm run start`: servidor sobre el build de producción
- `npm run lint`: lint con ESLint

## Compartir por internet (opcional, con ngrok)

Con la app corriendo en local (`npm run dev`), en otra terminal:

```bash
ngrok http 3000
```

Usa la URL HTTPS que entrega `ngrok` para abrir la app desde otro dispositivo/red.
