"use client";

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <title>Chispa</title>
        <meta name="description" content="Aprende a escribir letras y números con IA" />
      </head>
      <body>{children}</body>
    </html>
  );
}
