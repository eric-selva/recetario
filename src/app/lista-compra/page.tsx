'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Skeleton } from 'boneyard-js/react'

interface ShoppingItem {
  id: string
  recipe_id: string
  added_at: string
  recipe?: {
    id: string
    title: string
    meal_type: string
  }
  ingredients: {
    id: string
    name: string
    quantity: number
    unit: string
  }[]
}

interface MergedIngredient {
  name: string
  entries: { quantity: number; unit: string }[]
  checked: boolean
}

export default function ListaCompraPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function fetchList() {
    setLoading(true)
    fetch('/api/lista-compra')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchList() }, [])

  // Merge duplicate ingredients across recipes, grouping by normalized name + unit
  const mergedIngredients = useMemo(() => {
    const map = new Map<string, MergedIngredient>()

    for (const item of items) {
      for (const ing of item.ingredients) {
        const key = `${ing.name.toLowerCase().trim()}__${ing.unit}`
        const existing = map.get(key)

        if (existing) {
          existing.entries[0].quantity += ing.quantity
        } else {
          map.set(key, {
            name: ing.name,
            entries: [{ quantity: ing.quantity, unit: ing.unit }],
            checked: checked.has(key),
          })
        }
      }
    }

    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }))
  }, [items, checked])

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function removeRecipe(itemId: string) {
    await fetch(`/api/lista-compra?id=${itemId}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  async function clearAll() {
    if (!confirm('¿Vaciar toda la lista de la compra?')) return
    await fetch('/api/lista-compra', { method: 'DELETE' })
    setItems([])
    setChecked(new Set())
  }

  const checkedCount = mergedIngredients.filter((i) => checked.has(i.key)).length
  const totalCount = mergedIngredients.length

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold">Lista de la compra</h1>
        <Skeleton
          name="shopping-list"
          loading={true}
          className="mt-8"
          fixture={
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-10 w-32 rounded-full bg-stone-200" />
                <div className="h-10 w-32 rounded-full bg-stone-200" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-stone-200" />
              ))}
            </div>
          }
        >
          <div />
        </Skeleton>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold">Lista de la compra</h1>
        <div className="mt-20 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light/50 text-accent">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <p className="text-lg font-medium">La lista esta vacia</p>
          <p className="text-sm text-muted">
            Añade recetas a la lista desde el detalle de cada receta.
          </p>
          <Link
            href="/recetas"
            className="mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Ver recetas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lista de la compra</h1>
          <p className="mt-1 text-sm text-muted">
            {checkedCount} de {totalCount} ingredientes
          </p>
        </div>
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Vaciar lista
        </button>
      </div>

      {/* Recipes in list */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recetas de esta semana</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"
            >
              <Link
                href={`/recetas/${item.recipe_id}`}
                className="font-medium hover:text-accent"
              >
                {item.recipe?.title ?? 'Receta'}
              </Link>
              <button
                onClick={() => removeRecipe(item.id)}
                className="text-muted hover:text-red-600"
                title="Quitar de la lista"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Merged ingredient list */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Ingredientes</h2>
        <ul className="mt-3 space-y-2">
          {mergedIngredients.map((ing) => (
            <li key={ing.key}>
              <button
                onClick={() => toggleCheck(ing.key)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  checked.has(ing.key)
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-border bg-card hover:border-accent/30'
                }`}
              >
                {/* Checkbox */}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    checked.has(ing.key)
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-stone-300'
                  }`}
                >
                  {checked.has(ing.key) && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

                {/* Ingredient info */}
                <span className={`flex-1 ${checked.has(ing.key) ? 'text-muted line-through' : ''}`}>
                  <span className="font-medium capitalize">{ing.name}</span>
                </span>

                {/* Quantity */}
                <span className={`text-sm font-medium ${checked.has(ing.key) ? 'text-muted' : 'text-accent'}`}>
                  {ing.entries[0].quantity > 0 && `${formatQuantity(ing.entries[0].quantity)} ${ing.entries[0].unit}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progreso</span>
            <span className="text-muted">{Math.round((checkedCount / totalCount) * 100)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function formatQuantity(q: number): string {
  return q % 1 === 0 ? q.toString() : q.toFixed(1)
}
