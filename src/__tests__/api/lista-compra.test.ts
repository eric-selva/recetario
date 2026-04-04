import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('API /api/lista-compra', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('GET', () => {
    it('returns empty array when no items', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      const { GET } = await import('@/app/api/lista-compra/route')
      const response = await GET()
      const data = await response.json()

      expect(data).toEqual([])
    })

    it('returns 500 on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      })

      const { GET } = await import('@/app/api/lista-compra/route')
      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('adds a recipe to shopping list', async () => {
      const newItem = { id: 'sl1', recipe_id: 'r1', added_at: '2024-01-01' }
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newItem, error: null }),
          }),
        }),
      })

      const { POST } = await import('@/app/api/lista-compra/route')
      const request = new NextRequest('http://localhost/api/lista-compra', {
        method: 'POST',
        body: JSON.stringify({ recipe_id: 'r1' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.recipe_id).toBe('r1')
    })
  })

  describe('DELETE', () => {
    it('deletes a single item by id', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { DELETE } = await import('@/app/api/lista-compra/route')
      const request = new NextRequest('http://localhost/api/lista-compra?id=sl1', { method: 'DELETE' })
      const response = await DELETE(request)
      const data = await response.json()

      expect(data.success).toBe(true)
    })

    it('clears entire list when no id', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const { DELETE } = await import('@/app/api/lista-compra/route')
      const request = new NextRequest('http://localhost/api/lista-compra', { method: 'DELETE' })
      const response = await DELETE(request)
      const data = await response.json()

      expect(data.success).toBe(true)
    })
  })
})
