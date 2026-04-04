'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { RecipeWithDetails } from '@/types/database'

const mealTypeLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
}

export default function RecetaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToList, setAddingToList] = useState(false)
  const [addedToList, setAddedToList] = useState(false)

  useEffect(() => {
    fetch(`/api/recetas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => setRecipe(data))
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAddToShoppingList() {
    setAddingToList(true)
    const res = await fetch('/api/lista-compra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: id }),
    })
    if (res.ok) {
      setAddedToList(true)
      setTimeout(() => setAddedToList(false), 3000)
    }
    setAddingToList(false)
  }

  async function handleDelete() {
    if (!confirm('¿Seguro que quieres eliminar esta receta?')) return
    const res = await fetch(`/api/recetas/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/recetas')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-stone-100" />
          <div className="aspect-video rounded-2xl bg-stone-100" />
          <div className="space-y-3">
            <div className="h-5 w-full rounded bg-stone-100" />
            <div className="h-5 w-3/4 rounded bg-stone-100" />
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-medium">Receta no encontrada</p>
        <Link href="/recetas" className="mt-4 inline-block text-accent hover:underline">
          Volver a recetas
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link href="/recetas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a recetas
      </Link>

      {/* Image */}
      {recipe.image_url && (
        <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-stone-100">
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Title & meta */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
            {mealTypeLabels[recipe.meal_type]}
          </span>
          {recipe.prep_time > 0 && (
            <span className="text-sm text-muted">{recipe.prep_time} min</span>
          )}
          <span className="text-sm text-muted">{recipe.servings} raciones</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold">{recipe.title}</h1>
        {recipe.description && (
          <p className="mt-2 text-muted">{recipe.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleAddToShoppingList}
          disabled={addingToList}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            addedToList
              ? 'bg-green-600 text-white'
              : 'bg-accent text-white hover:bg-accent/90'
          }`}
        >
          {addedToList ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Añadida a la lista
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Añadir a la lista de compra
            </>
          )}
        </button>
        <Link
          href={`/recetas/${id}/editar`}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent-light/30"
        >
          Editar
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Ingredientes</h2>
          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="font-medium text-accent">
                  {ing.quantity > 0 && `${ing.quantity} ${ing.unit}`}
                </span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Paso a paso</h2>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="pt-1 leading-relaxed">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
