import Link from 'next/link'
import Image from 'next/image'
import type { Recipe } from '@/types/database'

const mealTypeLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
}

const mealTypeColors: Record<string, string> = {
  desayuno: 'bg-amber-100 text-amber-800',
  comida: 'bg-orange-100 text-orange-800',
  cena: 'bg-indigo-100 text-indigo-800',
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recetas/${recipe.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-accent/30 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${mealTypeColors[recipe.meal_type]}`}>
            {mealTypeLabels[recipe.meal_type]}
          </span>
          {recipe.prep_time > 0 && (
            <span className="text-xs text-muted">{recipe.prep_time} min</span>
          )}
        </div>
        <h3 className="font-semibold leading-snug group-hover:text-accent">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{recipe.description}</p>
        )}
      </div>
    </Link>
  )
}
