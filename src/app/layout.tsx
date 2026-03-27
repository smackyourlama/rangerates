import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RangeRates | Delivery Distance Intelligence",
  description:
    "RangeRates produces instant, shareable delivery quotes for Tecumseh-based Mac Services routes."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
