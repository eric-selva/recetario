import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock supabase
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

function createChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {}
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
      if (prop === 'then') return undefined
      return (..._args: unknown[]) => new Proxy(chain, handler)
    },
  }

  // Override the terminal methods
  const proxy = new Proxy(chain, handler)
  return {
    proxy,
    resolveWith: (val: unknown) => {
      const p = new Proxy(chain, {
        get(_, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(val)
          return (..._args: unknown[]) => new Proxy(chain, {
            get(_, prop2) {
              if (prop2 === 'then') return (resolve: (v: unknown) => void) => resolve(val)
              return (..._args2: unknown[]) => p
            },
          })
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
    it('returns recipes list', async () => {
      const mockRecipes = [{ id: '1', title: 'Test' }]
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
          eq: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
        }),
      })

      const { GET } = await import('@/app/api/recetas/route')
      const request = new NextRequest('http://localhost/api/recetas')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toEqual(mockRecipes)
    })

    it('returns 500 on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
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
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: '1', title: 'Test' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'ingredients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [{ id: 'i1', name: 'Sal' }], error: null }),
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
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }))

      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE', () => {
    it('deletes a recipe', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { DELETE } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(data.success).toBe(true)
    })
  })
})
