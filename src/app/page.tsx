import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-8 text-center">
        {/* Decorative pot icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6 2 10c0 2.5 1.5 4.5 3 6l1 6h12l1-6c1.5-1.5 3-3.5 3-6 0-4-4.48-8-10-8z" />
            <path d="M9 22h6" />
            <path d="M12 2v4" />
            <path d="M8 4l1 3" />
            <path d="M16 4l-1 3" />
          </svg>
        </div>

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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Ver recetas
          </Link>
          <Link
            href="/recetas/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 bg-card px-7 py-3.5 text-sm font-semibold text-primary transition-all hover:border-primary/40 hover:bg-primary-light"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva receta
          </Link>
        </div>
      </section>

      <div className="divider-herbs my-16" />

      {/* Feature cards */}
      <section className="grid gap-6 sm:grid-cols-3">
        <FeatureCard
          title="Tus recetas"
          description="Explora por tipo de comida, busca por ingredientes o titulo."
          href="/recetas"
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          color="primary"
        />
        <FeatureCard
          title="Crear receta"
          description="Ingredientes con cantidades, pasos detallados y foto."
          href="/recetas/nueva"
          icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          color="olive"
        />
        <FeatureCard
          title="Lista de compra"
          description="Genera tu lista semanal a partir de las recetas que elijas."
          href="/lista-compra"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          color="saffron"
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: 'primary' | 'olive' | 'saffron';
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      hover: 'hover:border-primary/30',
    },
    olive: {
      bg: 'bg-olive/10',
      text: 'text-olive',
      hover: 'hover:border-olive/30',
    },
    saffron: {
      bg: 'bg-saffron/20',
      text: 'text-saffron',
      hover: 'hover:border-saffron/40',
    },
  }

  const c = colorMap[color]

  return (
    <Link
      href={href}
      className={`group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md ${c.hover}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <h3 className="font-heading text-lg font-semibold group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}
