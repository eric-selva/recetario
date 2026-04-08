import { createClient } from '@supabase/supabase-js'

// Service-level client for operations that don't need user context (e.g., storage)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
