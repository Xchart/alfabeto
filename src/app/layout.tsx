"use client";

import "./globals.css";
import { PostHogProvider } from "./components/PostHogProvider";

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
      <body><PostHogProvider>{children}</PostHogProvider></body>
    </html>
  );
}
