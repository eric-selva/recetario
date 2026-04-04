'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Skeleton } from 'boneyard-js/react'


interface ShoppingItem {
  id: string
  recipe_id: string
  added_at: string
  servings: number
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

export default function ListaCompraPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  function fetchList() {
    setLoading(true)
    fetch('/api/lista-compra')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchList() }, [])

  const mergedIngredients = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; unit: string }>()

    for (const item of items) {
      const multiplier = item.servings || 4
      for (const ing of item.ingredients) {
        const normalized = ing.name.toLowerCase().trim()
        const key = `${normalized}__${ing.unit}`
        if (removed.has(key)) continue

        const scaledQty = ing.quantity * multiplier
        const existing = map.get(key)
        if (existing) {
          existing.quantity += scaledQty
        } else {
          map.set(key, { name: ing.name, quantity: scaledQty, unit: ing.unit })
        }
      }
    }

    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }))
  }, [items, removed])

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function removeIngredient(key: string) {
    setRemoved((prev) => new Set(prev).add(key))
    setChecked((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  function removeChecked() {
    setRemoved((prev) => {
      const next = new Set(prev)
      for (const key of checked) next.add(key)
      return next
    })
    setChecked(new Set())
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
    setRemoved(new Set())
  }

  const checkedCount = mergedIngredients.filter((i) => checked.has(i.key)).length
  const totalCount = mergedIngredients.length

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold">Lista de la compra</h1>
        <Skeleton
          name="shopping-list"
          loading={true}
          className="mt-8"
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="flex gap-2">
                <div className="h-10 w-32 rounded-full bg-primary-light/40" />
                <div className="h-10 w-32 rounded-full bg-primary-light/40" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-primary-light/25" />
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
        <h1 className="font-heading text-3xl font-bold">Lista de la compra</h1>
        <div className="mt-20 flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-olive/10 text-olive">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="font-heading text-xl font-semibold">La lista esta vacia</p>
            <p className="mt-1 text-sm text-muted">
              Añade recetas a la lista desde el detalle de cada receta.
            </p>
          </div>
          <Link
            href="/recetas"
            className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark"
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
          <h1 className="font-heading text-3xl font-bold">Lista de la compra</h1>
          <p className="mt-1 text-sm text-muted">
            {checkedCount} de {totalCount} ingredientes
          </p>
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button
              onClick={removeChecked}
              className="inline-flex items-center gap-2 rounded-xl border border-olive/30 px-4 py-2 text-sm font-semibold text-olive transition-all hover:bg-olive-light"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Quitar  ({checkedCount})
            </button>
          )}
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Vaciar lista
          </button>
        </div>
      </div>

      {/* Recipes in list */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">Recetas de esta semana</h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm"
            >
              <Link
                href={`/recetas/${item.recipe_id}`}
                className="font-medium hover:text-primary"
              >
                {item.recipe?.title ?? 'Receta'}
              </Link>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                ×{item.servings}
              </span>
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

      <div className="divider-herbs my-8" />

      {/* Merged ingredient list */}
      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/15 text-saffron">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">Ingredientes</h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          Especias, salsas, aceite, agua y basicos de despensa se excluyen automaticamente.
        </p>
        <ul className="mt-4 space-y-2">
          {mergedIngredients.map((ing) => (
            <li key={ing.key} className="flex items-center gap-2">
              <button
                onClick={() => toggleCheck(ing.key)}
                className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  checked.has(ing.key)
                    ? 'border-olive/30 bg-olive-light/50'
                    : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
                }`}
              >
                {/* Checkbox */}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    checked.has(ing.key)
                      ? 'border-olive bg-olive text-white'
                      : 'border-muted/40'
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
                <span className={`text-sm font-semibold ${checked.has(ing.key) ? 'text-muted' : 'text-primary'}`}>
                  {ing.quantity > 0 && `${formatQuantity(ing.quantity)} ${ing.unit}`}
                </span>
              </button>

              {/* Remove single ingredient */}
              <button
                onClick={() => removeIngredient(ing.key)}
                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                title="Quitar ingrediente"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-heading font-semibold">Progreso</span>
            <span className="text-muted">{Math.round((checkedCount / totalCount) * 100)}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary-light/50">
            <div
              className="h-full rounded-full bg-olive transition-all duration-500"
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
