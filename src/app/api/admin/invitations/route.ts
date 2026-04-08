import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  return data?.is_admin === true
}

// GET /api/admin/invitations — list all invitations
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(supabase, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// POST /api/admin/invitations — create invitation
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(supabase, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      token,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

// DELETE /api/admin/invitations?id=xxx — revoke invitation
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(supabase, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('invitations').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
