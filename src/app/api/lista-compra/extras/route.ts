import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// GET /api/lista-compra/extras
export async function GET() {
  const { data, error } = await supabase
    .from('shopping_list_extras')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

// POST /api/lista-compra/extras — add a manual ingredient
export async function POST(request: NextRequest) {
  const { name, quantity, unit } = await request.json()

  const { data, error } = await supabase
    .from('shopping_list_extras')
    .insert({ name: name.trim(), quantity: quantity ?? 1, unit: unit ?? 'unidad' })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

// DELETE /api/lista-compra/extras?id=xxx or DELETE all
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (id) {
    const { error } = await supabase.from('shopping_list_extras').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('shopping_list_extras').delete().gte('created_at', '1970-01-01')
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
