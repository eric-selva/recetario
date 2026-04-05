import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// GET /api/despensa?location=nevera|congelador
export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get('location') || 'nevera'

  const { data: items, error } = await supabase
    .from('pantry')
    .select('*, catalog:catalog_id(id, name)')
    .eq('location', location)
    .order('added_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (location === 'congelador') {
    // Enrich with recipe details
    const recipeIds = [...new Set(items.filter((i) => i.recipe_id).map((i) => i.recipe_id))]
    if (recipeIds.length > 0) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds)

      const recipesMap = new Map((recipes || []).map((r) => [r.id, r]))
      const enriched = items.map((item) => ({
        ...item,
        catalog: undefined,
        recipe: item.recipe_id ? recipesMap.get(item.recipe_id) : null,
      }))
      return Response.json(enriched)
    }
  }

  // Nevera: enrich with catalog name
  const enriched = items.map((item) => {
    const catalog = item.catalog as unknown as { id: string; name: string } | null
    return {
      ...item,
      catalog: undefined,
      name: catalog?.name ?? null,
      catalog_id: item.catalog_id ?? catalog?.id ?? null,
    }
  })

  return Response.json(enriched)
}

// POST /api/despensa — add item
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { location, name, quantity, unit, recipe_id, servings } = body

  const row: Record<string, unknown> = { location }
  if (location === 'nevera') {
    row.quantity = quantity ?? 1
    row.unit = unit ?? 'unidad'

    // Resolve catalog_id (source of truth for name)
    const catalogId = await resolveCatalogId(name, unit ?? 'unidad')
    if (catalogId) row.catalog_id = catalogId
  } else {
    row.recipe_id = recipe_id
    row.servings = servings ?? 4
  }

  const { data, error } = await supabase
    .from('pantry')
    .insert(row)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

// PATCH /api/despensa — update servings or quantity
export async function PATCH(request: NextRequest) {
  const { id, servings, quantity } = await request.json()

  const update: Record<string, unknown> = {}
  if (servings !== undefined) update.servings = servings
  if (quantity !== undefined) update.quantity = quantity

  const { error } = await supabase
    .from('pantry')
    .update(update)
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

// DELETE /api/despensa?id=xxx or DELETE all for location
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const location = request.nextUrl.searchParams.get('location')

  if (id) {
    const { error } = await supabase.from('pantry').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else if (location) {
    const { error } = await supabase.from('pantry').delete().eq('location', location)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

// Look up or create a catalog entry, returns catalog ID
async function resolveCatalogId(
  name: string,
  unit: string,
): Promise<string | null> {
  const trimmed = name.trim()

  const { data: existing } = await supabase
    .from('catalog')
    .select('id')
    .ilike('name', trimmed)
    .limit(1)
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('catalog')
    .insert({ name: trimmed, default_unit: unit, shoppable: true })
    .select('id')
    .single()

  return created?.id ?? null
}
