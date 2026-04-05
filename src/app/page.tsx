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
        <Image src="/logo.png" alt="Recetario" width={90} height={90} className="mb-6" priority />

        <h1 className="font-heading text-4xl font-bold tracking-tight">Recetario</h1>
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="flex flex-col items-center gap-6 text-center">
        <Image src="/logo.png" alt="Recetario" width={140} height={140} priority />

        <div>
          <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
            Recetario
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
            Tu cocina, tus recetas, tu sabor. Organiza tus comidas de la semana
            y genera la lista de la compra en un momento.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:w-full sm:max-w-2xl [&>a]:sm:flex-1">
          <Link
            href="/recetas"
            className="grid grid-cols-[18px_1fr] items-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30 sm:inline-flex sm:justify-center sm:py-2.5"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h4" />
            </svg>
            Ver recetas
          </Link>
          <Link
            href="/despensa"
            className="grid grid-cols-[18px_1fr] items-center gap-2.5 rounded-2xl border-2 border-saffron/20 bg-card px-7 py-3.5 text-sm font-semibold text-saffron transition-all hover:border-saffron/40 hover:bg-saffron/10 sm:inline-flex sm:justify-center sm:py-2.5"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Despensa
          </Link>
          <Link
            href="/lista-compra"
            className="grid grid-cols-[18px_1fr] items-center gap-2.5 rounded-2xl border-2 border-olive/20 bg-card px-7 py-3.5 text-sm font-semibold text-olive transition-all hover:border-olive/40 hover:bg-olive-light sm:inline-flex sm:justify-center sm:py-2.5"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 3.5h2l.6 3M7 13h10l4-8H6.1" />
              <circle cx="8" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M7 13l-1.4-7" />
            </svg>
            Lista de compra
          </Link>
        </div>
      </section>
    </div>
  );
}
