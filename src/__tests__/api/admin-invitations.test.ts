import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createQueryChain } from '../helpers/supabase-mock'

const ADMIN_USER = { id: 'admin-id', email: 'admin@test.com' }
const REGULAR_USER = { id: 'user-id', email: 'user@test.com' }

let mockUser: typeof ADMIN_USER | null = null
let profileIsAdmin = false
const mockInsertSelect = vi.fn()

const mockSupabase = {
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
  },
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return createQueryChain({
        data: profileIsAdmin ? { is_admin: true } : { is_admin: false },
        error: null,
      })
    }
    if (table === 'invitations') {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsertSelect,
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }
    return createQueryChain()
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: () => 'test-token-abc123',
  })),
}))

describe('Admin invitations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    profileIsAdmin = false
  })

  describe('GET /api/admin/invitations', () => {
    it('returns 403 for unauthenticated users', async () => {
      mockUser = null
      const { GET } = await import('@/app/api/admin/invitations/route')
      const response = await GET()
      expect(response.status).toBe(403)
    })

    it('returns 403 for non-admin users', async () => {
      mockUser = REGULAR_USER
      profileIsAdmin = false
      const { GET } = await import('@/app/api/admin/invitations/route')
      const response = await GET()
      expect(response.status).toBe(403)
    })

    it('returns 200 for admin users', async () => {
      mockUser = ADMIN_USER
      profileIsAdmin = true
      const { GET } = await import('@/app/api/admin/invitations/route')
      const response = await GET()
      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/admin/invitations', () => {
    it('returns 403 for non-admin users', async () => {
      mockUser = REGULAR_USER
      profileIsAdmin = false
      const { POST } = await import('@/app/api/admin/invitations/route')
      const response = await POST()
      expect(response.status).toBe(403)
    })

    it('creates invitation for admin users', async () => {
      mockUser = ADMIN_USER
      profileIsAdmin = true
      mockInsertSelect.mockResolvedValue({
        data: { id: 'inv-1', token: 'test-token-abc123' },
        error: null,
      })
      const { POST } = await import('@/app/api/admin/invitations/route')
      const response = await POST()
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.token).toBe('test-token-abc123')
    })
  })

  describe('DELETE /api/admin/invitations', () => {
    it('returns 403 for non-admin users', async () => {
      mockUser = REGULAR_USER
      profileIsAdmin = false
      const { DELETE } = await import('@/app/api/admin/invitations/route')
      const request = new Request('http://localhost/api/admin/invitations?id=inv-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request)
      expect(response.status).toBe(403)
    })
  })
})
