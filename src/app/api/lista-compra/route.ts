import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// GET /api/lista-compra — get shopping list with recipe details and ingredients
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: items, error } = await supabase
    .from('shopping_list')
    .select('*')
    .order('added_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!items.length) {
    return Response.json([])
  }

  // Get recipe details and ingredients for all items
  const recipeIds = [...new Set(items.map((i) => i.recipe_id))]

  const [recipesRes, ingredientsRes] = await Promise.all([
    supabase.from('recipes').select('*').in('id', recipeIds),
    supabase
      .from('ingredients')
      .select('*, catalog:catalog_id(id, name, shoppable)')
      .in('recipe_id', recipeIds)
      .order('order'),
  ])

  const recipesMap = new Map((recipesRes.data || []).map((r) => [r.id, r]))

  // Filter shoppable and enrich with catalog data
  const ingredientsByRecipe = new Map<string, Array<Record<string, unknown>>>()
  for (const ing of ingredientsRes.data || []) {
    const catalog = ing.catalog as { id: string; name: string; shoppable: boolean } | null
    const isShoppable = catalog?.shoppable ?? true

    if (!isShoppable) continue

    const list = ingredientsByRecipe.get(ing.recipe_id) || []
    list.push({
      id: ing.id,
      catalog_id: ing.catalog_id ?? catalog?.id ?? null,
      name: catalog?.name ?? '',
      quantity: ing.quantity,
      unit: ing.unit,
    })
    ingredientsByRecipe.set(ing.recipe_id, list)
  }

  const result = items.map((item) => ({
    ...item,
    recipe: recipesMap.get(item.recipe_id),
    ingredients: ingredientsByRecipe.get(item.recipe_id) || [],
  }))

  return Response.json(result)
}

// POST /api/lista-compra — add a recipe to shopping list
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { recipe_id, servings = 4 } = await request.json()

  const { data, error } = await supabase
    .from('shopping_list')
    .insert({ recipe_id, servings })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

// DELETE /api/lista-compra — clear entire list or remove one item
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = request.nextUrl
  const itemId = searchParams.get('id')

  if (itemId) {
    const { error } = await supabase.from('shopping_list').delete().eq('id', itemId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('shopping_list').delete().gte('added_at', '1970-01-01')
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
