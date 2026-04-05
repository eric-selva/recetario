import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('API /api/ingredientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns catalog entries', async () => {
    const catalog = [
      { id: 'c1', name: 'Zanahoria', default_unit: 'unidad', shoppable: true },
      { id: 'c2', name: 'Cebolla', default_unit: 'unidad', shoppable: true },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: catalog, error: null }),
      }),
    })

    const { GET } = await import('@/app/api/ingredientes/route')
    const request = new NextRequest('http://localhost/api/ingredientes')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Zanahoria')
    expect(data[0].unit).toBe('unidad')
  })

  it('filters by search term via ilike', async () => {
    const catalog = [
      { id: 'c1', name: 'Cebolla', default_unit: 'unidad', shoppable: true },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({ data: catalog, error: null }),
        }),
        ilike: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: catalog, error: null }),
        }),
      }),
    })

    const { GET } = await import('@/app/api/ingredientes/route')
    const request = new NextRequest('http://localhost/api/ingredientes?search=ceb')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Cebolla')
  })

  it('returns 500 on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    })

    const { GET } = await import('@/app/api/ingredientes/route')
    const request = new NextRequest('http://localhost/api/ingredientes')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
