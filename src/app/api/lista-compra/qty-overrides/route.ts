import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// GET /api/lista-compra/qty-overrides
export async function GET() {
  const { data, error } = await supabase
    .from('shopping_qty_overrides')
    .select('*')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// PUT /api/lista-compra/qty-overrides — upsert an override
export async function PUT(request: NextRequest) {
  const { ingredient_key, quantity } = await request.json()

  const { error } = await supabase
    .from('shopping_qty_overrides')
    .upsert(
      { ingredient_key, quantity },
      { onConflict: 'ingredient_key' },
    )

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

// DELETE /api/lista-compra/qty-overrides?key=xxx or DELETE all
export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')

  if (key) {
    const { error } = await supabase
      .from('shopping_qty_overrides')
      .delete()
      .eq('ingredient_key', key)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('shopping_qty_overrides')
      .delete()
      .gte('created_at', '1970-01-01')
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
