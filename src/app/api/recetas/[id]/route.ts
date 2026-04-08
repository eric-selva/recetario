import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// GET /api/recetas/[id] — get recipe with ingredients and steps
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify user has access to this recipe
  const { data: link } = await supabase
    .from('user_recipes')
    .select('recipe_id')
    .eq('user_id', user.id)
    .eq('recipe_id', id)
    .single()

  if (!link) {
    return Response.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', id).single(),
    supabase.from('ingredients').select('*, catalog:catalog_id(id, name, shoppable)').eq('recipe_id', id).order('order'),
    supabase.from('steps').select('*').eq('recipe_id', id).order('order'),
  ])

  if (recipeRes.error) {
    return Response.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  const ingredients = (ingredientsRes.data || []).map((ing) => {
    const catalog = ing.catalog as { id: string; name: string; shoppable: boolean } | null
    return {
      id: ing.id,
      recipe_id: ing.recipe_id,
      catalog_id: ing.catalog_id,
      name: catalog?.name ?? '',
      quantity: ing.quantity,
      unit: ing.unit,
      order: ing.order,
      shoppable: catalog?.shoppable ?? true,
    }
  })

  return Response.json({
    ...recipeRes.data,
    is_owner: recipeRes.data.owner_id === user.id || recipeRes.data.owner_id === null,
    ingredients,
    steps: stepsRes.data || [],
  })
}

// PUT /api/recetas/[id] — update recipe (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Check ownership
  const { data: recipe } = await supabase
    .from('recipes')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!recipe) {
    return Response.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  if (recipe.owner_id !== null && recipe.owner_id !== user.id) {
    return Response.json({ error: 'No tienes permiso para editar esta receta' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, image_url, meal_type, prep_time, servings, calories, ingredients, steps } = body

  const { error: recipeError } = await supabase
    .from('recipes')
    .update({ title, description, image_url, meal_type, prep_time, servings, calories })
    .eq('id', id)

  if (recipeError) {
    return Response.json({ error: recipeError.message }, { status: 500 })
  }

  // Replace ingredients
  if (ingredients) {
    await supabase.from('ingredients').delete().eq('recipe_id', id)
    if (ingredients.length) {
      const ingredientRows = []
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i] as {
          name: string
          quantity: number
          unit: string
          shoppable?: boolean
          catalog_id?: string
        }
        const catalogId = ing.catalog_id ?? await resolveCatalogId(supabase, ing.name, ing.unit, ing.shoppable)
        ingredientRows.push({
          recipe_id: id,
          catalog_id: catalogId,
          quantity: ing.quantity,
          unit: ing.unit,
          order: i,
        })
      }
      await supabase.from('ingredients').insert(ingredientRows)
    }
  }

  // Replace steps
  if (steps) {
    await supabase.from('steps').delete().eq('recipe_id', id)
    if (steps.length) {
      const stepRows = steps.map((step: { instruction: string }, i: number) => ({
        recipe_id: id,
        order: i,
        instruction: step.instruction,
      }))
      await supabase.from('steps').insert(stepRows)
    }
  }

  return Response.json({ success: true })
}

// DELETE /api/recetas/[id] — delete recipe or unlink
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Check ownership
  const { data: recipe } = await supabase
    .from('recipes')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!recipe) {
    return Response.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  if (recipe.owner_id === user.id || recipe.owner_id === null) {
    // Owner or legacy recipe — full delete (cascade handles ingredients, steps, etc.)
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    // Not owner — just unlink from user
    const { error } = await supabase
      .from('user_recipes')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

async function resolveCatalogId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  unit: string,
  shoppable?: boolean,
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
    .insert({
      name: trimmed,
      default_unit: unit,
      shoppable: shoppable ?? true,
    })
    .select('id')
    .single()

  return created?.id ?? null
}
