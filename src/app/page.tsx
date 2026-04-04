import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Mi <span className="text-accent">Recetario</span>
        </h1>
        <p className="max-w-md text-lg text-muted">
          Todas tus recetas en un solo lugar. Organiza tus comidas y genera tu
          lista de la compra semanal.
        </p>
        <div className="flex gap-4">
          <Link
            href="/recetas"
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Ver recetas
          </Link>
          <Link
            href="/lista-compra"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent-light/30"
          >
            Lista de compra
          </Link>
        </div>
      </section>

      {/* Quick cards */}
      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        <QuickCard
          title="Recetas"
          description="Explora tus recetas por tipo de comida o busca por ingredientes."
          href="/recetas"
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
        <QuickCard
          title="Nueva receta"
          description="Crea una receta con ingredientes, cantidades y paso a paso."
          href="/recetas/nueva"
          icon="M12 4.5v15m7.5-7.5h-15"
        />
        <QuickCard
          title="Lista de compra"
          description="Genera tu lista semanal a partir de las recetas que elijas."
          href="/lista-compra"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </section>
    </div>
  );
}

function QuickCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/30 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light/50 text-accent">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="text-lg font-semibold group-hover:text-accent">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </Link>
  );
}
