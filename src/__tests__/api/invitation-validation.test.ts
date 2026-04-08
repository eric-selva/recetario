import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueryChain } from '../helpers/supabase-mock'

let tokenResult: unknown = null

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: vi.fn((table: string) => {
    if (table === 'invitations') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              gt: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: tokenResult,
                  error: tokenResult ? null : { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
      }
    }
    return createQueryChain()
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

describe('GET /api/registro/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenResult = null
  })

  it('returns 400 when no token provided', async () => {
    const { GET } = await import('@/app/api/registro/validate/route')
    const request = new Request('http://localhost/api/registro/validate')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 404 for invalid/expired token', async () => {
    tokenResult = null
    const { GET } = await import('@/app/api/registro/validate/route')
    const request = new Request('http://localhost/api/registro/validate?token=bad-token')
    const response = await GET(request)
    expect(response.status).toBe(404)
  })

  it('returns 200 for valid token', async () => {
    tokenResult = { id: 'inv-1' }
    const { GET } = await import('@/app/api/registro/validate/route')
    const request = new Request('http://localhost/api/registro/validate?token=valid-token')
    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.valid).toBe(true)
  })
})
