'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { MealType, IngredientUnit } from '@/types/database'

interface IngredientInput {
  name: string
  quantity: number
  unit: IngredientUnit
  shoppable: boolean
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
    initialData?.ingredients ?? [{ name: '', quantity: 0, unit: 'g', shoppable: true }]
  )
  const [steps, setSteps] = useState<StepInput[]>(
    initialData?.steps ?? [{ instruction: '' }]
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

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

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g', shoppable: true }])
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function updateIngredient(index: number, field: keyof IngredientInput, value: string | number | boolean) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

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

  const inputClass = 'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10'

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Basic info */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">Informacion basica</h2>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Titulo *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Tortilla de patatas"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripcion de la receta..."
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tipo de comida</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className={inputClass}
            >
              <option value="comida">Comida</option>
              <option value="cena">Cena</option>
              <option value="postre">Postre</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tiempo (min)</label>
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Raciones</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Image */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-olive/10 text-olive">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">Imagen</h2>
        </div>
        <div className="flex items-center gap-4">
          {imageUrl && (
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-primary-light/20">
              <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
            </div>
          )}
          <label className="cursor-pointer rounded-xl border-2 border-dashed border-border px-6 py-4 text-sm text-muted transition-all hover:border-primary hover:bg-primary-light/20 hover:text-primary">
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
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/15 text-saffron">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">Ingredientes</h2>
        </div>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ingrediente"
              value={ing.name}
              onChange={(e) => updateIngredient(i, 'name', e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <input
              type="number"
              placeholder="0"
              min={0}
              step="any"
              value={ing.quantity || ''}
              onChange={(e) => updateIngredient(i, 'quantity', Number(e.target.value))}
              className="w-20 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => updateIngredient(i, 'shoppable', !ing.shoppable)}
              className={`rounded-lg p-2 transition-colors ${
                ing.shoppable
                  ? 'text-olive hover:bg-olive-light'
                  : 'text-muted/40 hover:bg-primary-light'
              }`}
              title={ing.shoppable ? 'Se añade a la lista de compra' : 'No se añade a la lista de compra'}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 3.5h2l.6 3M7 13h10l4-8H6.1M7 13l-1.4-7M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </button>
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir ingrediente
        </button>
      </section>

      {/* Steps */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-olive/10 text-olive">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">Paso a paso</h2>
        </div>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive text-xs font-bold text-white">
              {i + 1}
            </span>
            <textarea
              placeholder={`Paso ${i + 1}...`}
              value={step.instruction}
              onChange={(e) => updateStep(i, e.target.value)}
              rows={2}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir paso
        </button>
      </section>

      {/* Submit */}
      <div className="flex gap-3 border-t border-border pt-8">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="rounded-2xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-lg disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear receta'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-border px-7 py-3 text-sm font-semibold transition-colors hover:bg-primary-light/30"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
