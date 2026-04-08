import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('recipe-images')
    .upload(fileName, file, { contentType: file.type })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('recipe-images')
    .getPublicUrl(fileName)

  return Response.json({ url: urlData.publicUrl })
}
