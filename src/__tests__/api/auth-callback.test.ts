import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createQueryChain } from '../helpers/supabase-mock'

const TEST_USER = { id: 'new-user-id', email: 'new@test.com' }
const EXISTING_USER = { id: 'existing-id', email: 'existing@test.com' }

let mockUser: typeof TEST_USER | null = null
let invitationResult: unknown = null
let userRecipesCount = 0
let signOutCalled = false
let rpcCalled = false
let invitationUpdated = false

const mockSupabase = {
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn(() => {
      signOutCalled = true
      return Promise.resolve({ error: null })
    }),
  },
  from: vi.fn((table: string) => {
    if (table === 'invitations') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              gt: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: invitationResult,
                  error: invitationResult ? null : { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn(() => {
            invitationUpdated = true
            return Promise.resolve({ error: null })
          }),
        }),
      }
    }
    if (table === 'user_recipes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: userRecipesCount,
          }),
        }),
      }
    }
    return createQueryChain()
  }),
  rpc: vi.fn(() => {
    rpcCalled = true
    return Promise.resolve({ data: null, error: null })
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

describe('Auth callback /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    invitationResult = null
    userRecipesCount = 0
    signOutCalled = false
    rpcCalled = false
    invitationUpdated = false
  })

  it('redirects to /?error=auth when no code is provided', async () => {
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest('http://localhost/auth/callback')
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('?error=auth')
  })

  it('redirects to /?error=auth when code exchange fails', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'fail' } })
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest('http://localhost/auth/callback?code=bad-code')
    const response = await GET(request)
    expect(response.headers.get('location')).toContain('?error=auth')
  })

  it('new user WITH valid invitation → links all recipes', async () => {
    mockUser = TEST_USER
    invitationResult = { id: 'inv-1', token: 'valid-token' }
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest('http://localhost/auth/callback?code=good-code&token=valid-token')
    const response = await GET(request)

    expect(response.headers.get('location')).toContain('/recetas')
    expect(invitationUpdated).toBe(true)
    expect(rpcCalled).toBe(true) // link_all_recipes_to_user called
    expect(signOutCalled).toBe(false)
  })

  it('new user WITHOUT invitation → signs out and rejects', async () => {
    mockUser = TEST_USER
    userRecipesCount = 0
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest('http://localhost/auth/callback?code=good-code')
    const response = await GET(request)

    expect(response.headers.get('location')).toContain('?error=no-invitation')
    expect(signOutCalled).toBe(true)
    expect(rpcCalled).toBe(false) // should NOT link recipes
  })

  it('existing user (has recipes) → logs in normally', async () => {
    mockUser = EXISTING_USER
    userRecipesCount = 5
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest('http://localhost/auth/callback?code=good-code')
    const response = await GET(request)

    expect(response.headers.get('location')).toContain('/recetas')
    expect(signOutCalled).toBe(false)
    expect(rpcCalled).toBe(false) // already has recipes, no need to link
  })

  it('new user with expired/used invitation token → no recipes linked', async () => {
    mockUser = TEST_USER
    invitationResult = null // invalid token
    userRecipesCount = 0
    const { GET } = await import('@/app/auth/callback/route')
    const request = new NextRequest('http://localhost/auth/callback?code=good-code&token=expired-token')
    const response = await GET(request)

    // Token was invalid, so no invitation processing happened
    // User has no recipes, falls through to the else branch
    expect(rpcCalled).toBe(false)
  })
})
