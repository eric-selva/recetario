import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recetario",
    template: "%s | Recetario",
  },
  description: "Tu recetario personal con lista de la compra semanal",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#c45d35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthGate>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border bg-card/50 py-6 text-center text-xs text-muted">
            <div className="divider-herbs mb-4" />
            Recetario &mdash; Cocina con amor
          </footer>
        </AuthGate>
      </body>
    </html>
  );
}
