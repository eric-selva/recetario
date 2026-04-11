import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// GET /api/lista-compra/state — fetch all persisted item states
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('shopping_item_state')
    .select('ingredient_key, checked, removed')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data ?? [])
}

// PUT /api/lista-compra/state — upsert state for one ingredient_key
// Body: { ingredient_key, checked?, removed? }
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ingredient_key } = body
  if (!ingredient_key) {
    return Response.json({ error: 'ingredient_key required' }, { status: 400 })
  }

  // Build the row to upsert. Read existing row to keep the other flag
  // intact when only one is provided.
  const { data: existing } = await supabase
    .from('shopping_item_state')
    .select('checked, removed')
    .eq('ingredient_key', ingredient_key)
    .maybeSingle()

  const checked = body.checked ?? existing?.checked ?? false
  const removed = body.removed ?? existing?.removed ?? false

  const { error } = await supabase
    .from('shopping_item_state')
    .upsert(
      { ingredient_key, checked, removed, updated_at: new Date().toISOString() },
      { onConflict: 'ingredient_key' },
    )

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

// DELETE /api/lista-compra/state?key=xxx → delete one row
// DELETE /api/lista-compra/state              → clear all rows
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const key = request.nextUrl.searchParams.get('key')

  if (key) {
    const { error } = await supabase
      .from('shopping_item_state')
      .delete()
      .eq('ingredient_key', key)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('shopping_item_state')
      .delete()
      .gte('updated_at', '1970-01-01')
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
