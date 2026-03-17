import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mazalife — Tourism & Entertainment · Mazatlán",
  description: "Vive Mazatlán como nunca. Tirolesa del Faro, Beach Club, Observatorio histórico, Museo Ballena y más. Reserva tu experiencia en línea.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://js.stripe.com/v3/" async />
      </head>
      <body>{children}</body>
    </html>
  );
}
