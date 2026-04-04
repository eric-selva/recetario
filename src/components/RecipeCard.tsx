import Link from 'next/link'
import Image from 'next/image'
import type { Recipe } from '@/types/database'

const mealTypeLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
}

const mealTypeStyles: Record<string, { bg: string; text: string; icon: string }> = {
  desayuno: {
    bg: 'bg-saffron/15',
    text: 'text-saffron',
    icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707',
  },
  comida: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636',
  },
  cena: {
    bg: 'bg-olive/10',
    text: 'text-olive',
    icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
  },
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const style = mealTypeStyles[recipe.meal_type] ?? mealTypeStyles.comida

  return (
    <Link
      href={`/recetas/${recipe.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-light/30">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary/20">
            <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6 2 10c0 2.5 1.5 4.5 3 6l1 6h12l1-6c1.5-1.5 3-3.5 3-6 0-4-4.48-8-10-8z" />
              <path d="M9 22h6" />
              <path d="M12 2v4" />
              <path d="M8 4l1 3" />
              <path d="M16 4l-1 3" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        {recipe.image_url && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
        )}
      </div>
      <div className="p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
            </svg>
            {mealTypeLabels[recipe.meal_type]}
          </span>
          {recipe.prep_time > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.prep_time} min
            </span>
          )}
        </div>
        <h3 className="font-heading text-lg font-semibold leading-snug group-hover:text-primary">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{recipe.description}</p>
        )}
      </div>
    </Link>
  )
}
