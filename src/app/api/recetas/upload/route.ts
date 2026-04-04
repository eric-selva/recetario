import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// POST /api/recetas/upload — upload recipe image to Supabase Storage
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(fileName, file, {
      contentType: file.type,
    })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(fileName)

  return Response.json({ url: urlData.publicUrl })
}
