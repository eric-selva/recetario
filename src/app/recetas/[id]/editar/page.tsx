'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RecipeForm from '@/components/RecipeForm'
import type { RecipeWithDetails } from '@/types/database'

export default function EditarRecetaPage() {
  const { id } = useParams<{ id: string }>()
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/recetas/${id}`)
      .then((res) => res.json())
      .then((data) => setRecipe(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-primary-light/40" />
          <div className="h-64 rounded-2xl bg-primary-light/20" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-heading text-xl font-semibold">Receta no encontrada</p>
        <Link href="/recetas" className="mt-4 inline-flex items-center gap-1 text-primary hover:text-primary-dark">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a recetas
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Editar receta</h1>
      <p className="mt-2 text-muted">Modifica los datos de la receta.</p>
      <div className="divider-herbs my-6" />
      <div className="mt-2">
        <RecipeForm
          recipeId={id}
          initialData={{
            title: recipe.title,
            description: recipe.description,
            image_url: recipe.image_url,
            meal_type: recipe.meal_type,
            prep_time: recipe.prep_time,
            servings: recipe.servings,
            ingredients: recipe.ingredients.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              shoppable: i.shoppable ?? true,
            })),
            steps: recipe.steps.map((s) => ({
              instruction: s.instruction,
            })),
          }}
        />
      </div>
    </div>
  )
}
