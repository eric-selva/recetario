import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createQueryChain } from '../helpers/supabase-mock'

// All API routes that require auth — we test that each rejects unauthenticated requests

const mockSupabaseNoUser = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: vi.fn(() => createQueryChain({ data: [], error: null })),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseNoUser),
}))

// All API route modules and their HTTP methods
const apiRoutes = [
  { path: '@/app/api/recetas/route', methods: ['GET', 'POST'] },
  { path: '@/app/api/recetas/[id]/route', methods: ['GET', 'PUT', 'DELETE'], hasParams: true },
  { path: '@/app/api/despensa/route', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { path: '@/app/api/lista-compra/route', methods: ['GET', 'POST', 'DELETE'] },
  { path: '@/app/api/lista-compra/extras/route', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { path: '@/app/api/lista-compra/qty-overrides/route', methods: ['GET', 'PUT', 'DELETE'] },
  { path: '@/app/api/ingredientes/route', methods: ['GET'] },
  { path: '@/app/api/despensa/tupper-extras/route', methods: ['GET', 'POST', 'DELETE'] },
  { path: '@/app/api/admin/invitations/route', methods: ['GET', 'POST', 'DELETE'] },
]

describe('API auth guard — all routes reject unauthenticated requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseNoUser.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  for (const route of apiRoutes) {
    for (const method of route.methods) {
      it(`${method} ${route.path} returns 401 or 403`, async () => {
        const mod = await import(route.path)
        const handler = mod[method]
        expect(handler).toBeDefined()

        const request = new NextRequest(`http://localhost/api/test`, {
          method,
          ...((['POST', 'PUT', 'PATCH'].includes(method))
            ? { body: JSON.stringify({}) }
            : {}),
        })

        const params = route.hasParams
          ? { params: Promise.resolve({ id: 'test-id' }) }
          : undefined

        const response = await handler(request, params)
        expect([401, 403]).toContain(response.status)
      })
    }
  }
})
