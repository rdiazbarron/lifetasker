import "./globals.css";
import type { Metadata } from "next";
import { AppHeader } from "../components/AppHeader";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LifeTasker",
  description: "Sistema de progreso semanal flexible.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
