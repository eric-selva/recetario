import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const origin = request.nextUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      // If registration token present, validate and link all recipes
      if (token && user) {
        const { data: invitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (invitation) {
          // Mark invitation as used
          await supabase
            .from('invitations')
            .update({ used_by: user.id, used_at: new Date().toISOString() })
            .eq('id', invitation.id)

          // Link all existing recipes to the new user
          await supabase.rpc('link_all_recipes_to_user', { target_user_id: user.id })
        }
      } else if (user) {
        // Existing user login — check if they have any user_recipes
        const { count } = await supabase
          .from('user_recipes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (count === 0) {
          // New user without invitation token — reject registration
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/?error=no-invitation`)
        }
      }

      return NextResponse.redirect(`${origin}/recetas`)
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/?error=auth`)
}
