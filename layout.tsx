import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pit Control — Forecast & Dispatch",
  description: "Outil terrain de suivi de flotte, forecast BCM/h et simulation d'affectation des camions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}