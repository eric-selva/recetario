"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthed, login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(password);
    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }

  // Loading
  if (isAuthed === null) return null;

  // Not authenticated — show password form
  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Image src="/recetario-logo.png" alt="Recetario" width={90} height={90} className="mb-6" priority />

        <p className="mt-2 text-sm text-muted">Introduce la clave para acceder</p>

        <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Clave de acceso"
            autoFocus
            className={`w-full rounded-xl border bg-card px-4 py-3 text-center text-lg tracking-widest outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 ${
              error ? "border-red-400 ring-2 ring-red-100" : "border-border"
            }`}
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-lg"
          >
            Entrar
          </button>
          {error && (
            <p className="text-center text-sm text-red-500">Clave incorrecta</p>
          )}
        </form>
      </div>
    );
  }

  // Authenticated — show normal home
  return (
    <>
      <div className="home-page flex flex-1 flex-col items-center justify-center px-4">
        <section className="flex w-full max-w-3xl flex-col items-center gap-6">
          <Image src="/recetario-home.png" alt="Recetario" width={400} height={62} priority />

          <p className="max-w-lg text-justify text-lg text-muted">
              Tu cocina, tus recetas, tu sabor. Organiza tus comidas de la semana
              y genera la lista de la compra en un momento.
          </p>

          <div className="divider-herbs w-full max-w-lg" />

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4 [&>a]:sm:flex-1">
            <Link
              href="/recetas"
              className="flex items-center justify-center rounded-2xl bg-primary/15 px-7 py-3.5 text-lg font-semibold text-primary transition-all hover:bg-primary/25 sm:py-2.5"
            >
              <span className="inline-flex w-[140px] items-center gap-2.5 sm:w-auto sm:justify-center">
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
                  <path d="M8 7h6" />
                  <path d="M8 11h4" />
                </svg>
                Ver recetas
              </span>
            </Link>
            <Link
              href="/despensa"
              className="flex items-center justify-center rounded-2xl bg-saffron/15 px-7 py-3.5 text-lg font-semibold text-saffron transition-all hover:bg-saffron/25 sm:py-2.5"
            >
              <span className="inline-flex w-[140px] items-center gap-2.5 sm:w-auto sm:justify-center">
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Despensa
              </span>
            </Link>
            <Link
              href="/lista-compra"
              className="flex items-center justify-center rounded-2xl bg-olive/15 px-7 py-3.5 text-lg font-semibold text-olive transition-all hover:bg-olive/25 sm:py-2.5"
            >
              <span className="inline-flex w-[180px] items-center gap-2.5 sm:w-auto sm:justify-center">
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 3.5h2l.6 3M7 13h10l4-8H6.1" />
                  <circle cx="8" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                  <path d="M7 13l-1.4-7" />
                </svg>
                Lista de compra
              </span>
            </Link>
          </div>
        </section>
      </div>

    </>
  );
}
