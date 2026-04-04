'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Skeleton } from 'boneyard-js/react'
import RecipeCard from '@/components/RecipeCard'
import type { Recipe } from '@/types/database'

const mealTypes = [
  { value: 'todas', label: 'Todas' },
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'comida', label: 'Comida' },
  { value: 'cena', label: 'Cena' },
]

export default function RecetasPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [mealType, setMealType] = useState('todas')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch recipes when filters change
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (mealType !== 'todas') params.set('meal_type', mealType)
    if (searchDebounced) params.set('search', searchDebounced)

    fetch(`/api/recetas?${params}`)
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .finally(() => setLoading(false))
  }, [mealType, searchDebounced])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Recetas</h1>
        <Link
          href="/recetas/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva receta
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por titulo o ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Meal type selector */}
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {mealTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setMealType(type.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mealType === type.value
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe grid */}
      <Skeleton
        name="recipe-grid"
        loading={loading}
        className="mt-6"
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card">
                <div className="aspect-[4/3] bg-stone-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-16 rounded bg-stone-200" />
                  <div className="h-5 w-3/4 rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        {recipes.length === 0 ? (
          <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light/50 text-accent">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-lg font-medium">No hay recetas</p>
            <p className="text-sm text-muted">
              {search || mealType !== 'todas'
                ? 'No se encontraron recetas con estos filtros.'
                : 'Empieza creando tu primera receta.'}
            </p>
            {!search && mealType === 'todas' && (
              <Link
                href="/recetas/nueva"
                className="mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Crear receta
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </Skeleton>
    </div>
  )
}
