"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [error, setError] = useState(false);
  const supabase = createClient();
  const token = searchParams.get("token");

  useEffect(() => {
    // If already logged in, go to recetas
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/recetas");
        return;
      }

      if (!token) {
        setStatus("invalid");
        return;
      }

      // Validate token
      fetch(`/api/registro/validate?token=${token}`)
        .then((res) => setStatus(res.ok ? "valid" : "invalid"))
        .catch(() => setStatus("invalid"));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?token=${token}`,
      },
    });
  }

  if (status === "loading") return null;

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <Image
          src="/recetario-logo.png"
          alt="Recetario"
          width={90}
          height={90}
          className="mb-6"
          priority
        />
        <h1 className="font-heading text-2xl font-bold">Invitacion no valida</h1>
        <p className="mt-2 text-sm text-muted">
          Este enlace ha expirado o ya ha sido utilizado.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Image
        src="/recetario-logo.png"
        alt="Recetario"
        width={90}
        height={90}
        className="mb-6"
        priority
      />

      <h1 className="font-heading text-2xl font-bold">Te han invitado</h1>
      <p className="mt-2 text-sm text-muted">
        Crea tu cuenta para acceder al recetario
      </p>

      <button
        onClick={handleGoogleSignup}
        className="mt-8 flex w-full max-w-xs items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold transition-all hover:bg-card-hover hover:shadow-md"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Registrarse con Google
      </button>

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">
          Error al registrarse. Intentalo de nuevo.
        </p>
      )}
    </div>
  );
}
