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
          <div className="h-8 w-48 rounded bg-stone-100" />
          <div className="h-64 rounded-2xl bg-stone-100" />
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
      <h1 className="text-3xl font-bold">Editar receta</h1>
      <p className="mt-2 text-muted">Modifica los datos de la receta.</p>
      <div className="mt-8">
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
