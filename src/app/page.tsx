import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        {/* Colorful pot icon */}
        <svg className="h-24 w-24" viewBox="0 0 80 80" fill="none">
          {/* Pot body gradient */}
          <defs>
            <linearGradient id="potBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e87a56" />
              <stop offset="100%" stopColor="#a34420" />
            </linearGradient>
            <linearGradient id="potRim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c45d35" />
              <stop offset="100%" stopColor="#d4a24e" />
            </linearGradient>
          </defs>
          {/* Pot body */}
          <rect
            x="16"
            y="32"
            width="48"
            height="32"
            rx="8"
            fill="url(#potBody)"
          />
          {/* Pot rim */}
          <rect
            x="12"
            y="28"
            width="56"
            height="7"
            rx="3.5"
            fill="url(#potRim)"
          />
          {/* Left handle */}
          <rect x="4" y="38" width="10" height="5" rx="2.5" fill="#d4a24e" />
          {/* Right handle */}
          <rect x="66" y="38" width="10" height="5" rx="2.5" fill="#d4a24e" />
          {/* Steam 1 */}
          <path
            d="M28 24 Q29 16 28 9"
            stroke="#5a7247"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Steam 2 */}
          <path
            d="M40 22 Q41 14 40 7"
            stroke="#5a7247"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Steam 3 */}
          <path
            d="M52 24 Q53 16 52 9"
            stroke="#5a7247"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Lid knob */}
          <circle cx="40" cy="26" r="3.5" fill="#d4a24e" />
          {/* Highlight */}
          <rect
            x="22"
            y="40"
            width="16"
            height="3"
            rx="1.5"
            fill="#f0a080"
            opacity="0.4"
          />
          {/* Bottom stripe */}
          <rect
            x="20"
            y="56"
            width="40"
            height="3"
            rx="1.5"
            fill="#8b3a1a"
            opacity="0.3"
          />
        </svg>

        <div>
          <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
            Recetario
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
            Tu cocina, tus recetas, tu sabor. Organiza tus comidas de la semana
            y genera la lista de la compra en un momento.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/recetas"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30"
          >
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h4" />
            </svg>
            Ver recetas
          </Link>
          <Link
            href="/lista-compra"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-olive/20 bg-card px-7 py-3.5 text-sm font-semibold text-olive transition-all hover:border-olive/40 hover:bg-olive-light"
          >
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
