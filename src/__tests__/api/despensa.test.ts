import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}))

describe('API /api/despensa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('GET', () => {
    it('returns nevera items by default', async () => {
      const items = [{
        id: '1',
        quantity: 2,
        location: 'nevera',
        catalog_id: 'cat-1',
        catalog: { id: 'cat-1', name: 'Zanahoria' },
      }]
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: items, error: null }),
          }),
        }),
      })

      const { GET } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].name).toBe('Zanahoria')
      expect(data[0].catalog_id).toBe('cat-1')
    })

    it('returns congelador items with recipe details', async () => {
      const items = [{ id: '1', recipe_id: 'r1', servings: 4, location: 'congelador' }]
      const recipes = [{ id: 'r1', title: 'Pollo' }]

      mockFrom.mockImplementation((table: string) => {
        if (table === 'pantry') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: items, error: null }),
              }),
            }),
          }
        }
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: recipes, error: null }),
            }),
          }
        }
        return {}
      })

      const { GET } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa?location=congelador')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].recipe.title).toBe('Pollo')
    })

    it('returns 500 on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      })

      const { GET } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('adds ingredient to nevera', async () => {
      const newItem = { id: 'p1', name: 'Tomate', quantity: 1, unit: 'unidad', location: 'nevera', catalog_id: 'cat-1' }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'catalog') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'cat-1' }, error: null }),
                }),
              }),
            }),
          }
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: newItem, error: null }),
            }),
          }),
        }
      })

      const { POST } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa', {
        method: 'POST',
        body: JSON.stringify({ location: 'nevera', name: 'Tomate', quantity: 1, unit: 'unidad' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.name).toBe('Tomate')
    })

    it('adds recipe to congelador', async () => {
      const newItem = { id: 'p2', recipe_id: 'r1', servings: 4, location: 'congelador' }
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newItem, error: null }),
          }),
        }),
      })

      const { POST } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa', {
        method: 'POST',
        body: JSON.stringify({ location: 'congelador', recipe_id: 'r1', servings: 4 }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.recipe_id).toBe('r1')
    })

    it('returns 500 on insert error', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'catalog') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
            }),
          }),
        }
      })

      const { POST } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa', {
        method: 'POST',
        body: JSON.stringify({ location: 'nevera', name: 'X' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('PATCH', () => {
    it('updates servings for congelador item', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { PATCH } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'p1', servings: 6 }),
      })

      const response = await PATCH(request)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('updates quantity for nevera item', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { PATCH } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'p1', quantity: 3 }),
      })

      const response = await PATCH(request)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('DELETE', () => {
    it('deletes single item by id', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { DELETE } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa?id=p1', { method: 'DELETE' })
      const response = await DELETE(request)
      const data = await response.json()

      expect(data.success).toBe(true)
    })

    it('clears all items by location', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { DELETE } = await import('@/app/api/despensa/route')
      const request = new NextRequest('http://localhost/api/despensa?location=nevera', { method: 'DELETE' })
      const response = await DELETE(request)
      const data = await response.json()

      expect(data.success).toBe(true)
    })
  })
})
