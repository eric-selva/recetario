import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('invitations')
    .select('id')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  return Response.json({ valid: true })
}
