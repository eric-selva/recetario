import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// GET /api/ingredientes?search=xxx — search catalog entries
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')?.toLowerCase().trim()

  let query = supabase
    .from('catalog')
    .select('id, name, default_unit, shoppable')
    .order('name')

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Map to the shape the frontend expects
  const results = (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.default_unit,
  }))

  return Response.json(results)
}
