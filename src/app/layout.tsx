import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SESL — Self-Evolve Scaling Laws",
  description:
    "Status dashboard for the SESL self-evolve scaling-law harness: live grids, K-scaling curves, coverage matrix, and Phase-4 backlog.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
