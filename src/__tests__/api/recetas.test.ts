import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFrom = vi.fn()
const MOCK_USER = { id: 'user-1', email: 'test@test.com' }

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}))

function createChain(resolvedValue: unknown) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
      if (prop === 'then') return undefined
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }

  const proxy = new Proxy({}, handler)
  return {
    proxy,
    resolveWith: (val: unknown) => {
      const p = new Proxy({}, {
        get(_, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(val)
          return (..._args: unknown[]) => p
        },
      })
      return p
    },
  }
}

describe('API /api/recetas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('GET', () => {
    it('returns recipes list (paginated)', async () => {
      const mockRecipes = [{ id: '1', title: 'Test' }]
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ recipe_id: '1' }],
                error: null,
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null, count: 1 }),
                eq: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null, count: 1 }),
                }),
              }),
            }),
          }),
        }
      })

      const { GET } = await import('@/app/api/recetas/route')
      const request = new NextRequest('http://localhost/api/recetas')
      const response = await GET(request)
      const json = await response.json()

      expect(json.data).toEqual(mockRecipes)
      expect(json.total).toBe(1)
    })

    it('returns 500 on error', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ recipe_id: '1' }],
                error: null,
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: null }),
              }),
            }),
          }),
        }
      })

      const { GET } = await import('@/app/api/recetas/route')
      const request = new NextRequest('http://localhost/api/recetas')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('creates a recipe and returns 201', async () => {
      const newRecipe = { id: 'new-1', title: 'New Recipe' }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newRecipe, error: null }),
              }),
            }),
          }
        }
        if (table === 'user_recipes') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
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
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      const { POST } = await import('@/app/api/recetas/route')
      const request = new NextRequest('http://localhost/api/recetas', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Recipe',
          description: '',
          image_url: null,
          meal_type: 'comida',
          prep_time: 30,
          servings: 2,
          calories: 400,
          ingredients: [{ name: 'Sal', quantity: 1, unit: 'g' }],
          steps: [{ instruction: 'Paso 1' }],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.id).toBe('new-1')
    })
  })
})

describe('API /api/recetas/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('GET', () => {
    it('returns recipe with ingredients and steps', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { recipe_id: '1' }, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: '1', title: 'Test', owner_id: MOCK_USER.id }, error: null }),
              }),
            }),
          }
        }
        if (table === 'ingredients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'i1', recipe_id: '1', catalog_id: 'cat-1', catalog: { id: 'cat-1', name: 'Sal', shoppable: true }, quantity: 1, unit: 'g', order: 0 }],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [{ id: 's1', instruction: 'Paso' }], error: null }),
            }),
          }),
        }
      })

      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(data.title).toBe('Test')
      expect(data.ingredients).toHaveLength(1)
      expect(data.steps).toHaveLength(1)
    })

    it('returns 404 when not found', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE', () => {
    it('deletes a recipe when user is owner', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: '1', owner_id: MOCK_USER.id }, error: null }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      const { DELETE } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(data.success).toBe(true)
    })
  })
})
