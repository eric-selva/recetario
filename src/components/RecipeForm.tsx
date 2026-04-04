'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { MealType, IngredientUnit } from '@/types/database'

interface IngredientInput {
  name: string
  quantity: number
  unit: IngredientUnit
}

interface StepInput {
  instruction: string
}

interface RecipeFormProps {
  initialData?: {
    title: string
    description: string
    image_url: string | null
    meal_type: MealType
    prep_time: number
    servings: number
    ingredients: IngredientInput[]
    steps: StepInput[]
  }
  recipeId?: string
}

const units: { value: IngredientUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'unidad', label: 'ud' },
  { value: 'cucharada', label: 'cda' },
  { value: 'cucharadita', label: 'cdta' },
  { value: 'pizca', label: 'pizca' },
  { value: 'al gusto', label: 'al gusto' },
]

export default function RecipeForm({ initialData, recipeId }: RecipeFormProps) {
  const router = useRouter()
  const isEditing = !!recipeId

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null)
  const [mealType, setMealType] = useState<MealType>(initialData?.meal_type ?? 'comida')
  const [prepTime, setPrepTime] = useState(initialData?.prep_time ?? 0)
  const [servings, setServings] = useState(initialData?.servings ?? 2)
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialData?.ingredients ?? [{ name: '', quantity: 0, unit: 'g' }]
  )
  const [steps, setSteps] = useState<StepInput[]>(
    initialData?.steps ?? [{ instruction: '' }]
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/recetas/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (data.url) setImageUrl(data.url)
    setUploading(false)
  }

  // Ingredient helpers
  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g' }])
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function updateIngredient(index: number, field: keyof IngredientInput, value: string | number) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  // Step helpers
  function addStep() {
    setSteps([...steps, { instruction: '' }])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index))
  }

  function updateStep(index: number, instruction: string) {
    const updated = [...steps]
    updated[index] = { instruction }
    setSteps(updated)
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const body = {
      title,
      description,
      image_url: imageUrl,
      meal_type: mealType,
      prep_time: prepTime,
      servings,
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps.filter((s) => s.instruction.trim()),
    }

    const url = isEditing ? `/api/recetas/${recipeId}` : '/api/recetas'
    const method = isEditing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      if (isEditing) {
        router.push(`/recetas/${recipeId}`)
      } else {
        const recipe = await res.json()
        router.push(`/recetas/${recipe.id}`)
      }
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Informacion basica</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Titulo *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Tortilla de patatas"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripcion de la receta..."
            rows={2}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de comida</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="desayuno">Desayuno</option>
              <option value="comida">Comida</option>
              <option value="cena">Cena</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tiempo (min)</label>
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Raciones</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      </section>

      {/* Image */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Imagen</h2>
        <div className="flex items-center gap-4">
          {imageUrl && (
            <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-stone-100">
              <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
            </div>
          )}
          <label className="cursor-pointer rounded-xl border border-dashed border-border px-6 py-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent">
            {uploading ? 'Subiendo...' : imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Ingredientes</h2>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ingrediente"
              value={ing.name}
              onChange={(e) => updateIngredient(i, 'name', e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="0"
              min={0}
              step="any"
              value={ing.quantity || ''}
              onChange={(e) => updateIngredient(i, 'quantity', Number(e.target.value))}
              className="w-20 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir ingrediente
        </button>
      </section>

      {/* Steps */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Paso a paso</h2>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {i + 1}
            </span>
            <textarea
              placeholder={`Paso ${i + 1}...`}
              value={step.instruction}
              onChange={(e) => updateStep(i, e.target.value)}
              rows={2}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="mt-2.5 rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir paso
        </button>
      </section>

      {/* Submit */}
      <div className="flex gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear receta'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent-light/30"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
