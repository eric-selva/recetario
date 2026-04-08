import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createQueryChain } from '../helpers/supabase-mock'

const OWNER = { id: 'owner-id', email: 'owner@test.com' }
const OTHER = { id: 'other-id', email: 'other@test.com' }

let mockUser: typeof OWNER | null = null
let recipeOwner: string | null = 'owner-id'
let userHasLink = true
let deletedTable = ''
let deletedFilters: Record<string, string> = {}

const mockSupabase = {
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
  },
  from: vi.fn((table: string) => {
    if (table === 'user_recipes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: userHasLink ? { recipe_id: 'recipe-1' } : null,
              error: userHasLink ? null : { message: 'Not found' },
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn((...args: unknown[]) => {
              deletedTable = 'user_recipes'
              return Promise.resolve({ error: null })
            }),
          }),
        }),
      }
    }
    if (table === 'recipes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'recipe-1', owner_id: recipeOwner, title: 'Test Recipe' },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn((...args: unknown[]) => {
            deletedTable = 'recipes'
            return Promise.resolve({ error: null })
          }),
        }),
      }
    }
    if (table === 'ingredients') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    if (table === 'steps') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return createQueryChain()
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

describe('Recipe ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = OWNER
    recipeOwner = 'owner-id'
    userHasLink = true
    deletedTable = ''
    deletedFilters = {}
  })

  describe('GET /api/recetas/[id]', () => {
    it('returns is_owner=true when user is the owner', async () => {
      mockUser = OWNER
      recipeOwner = OWNER.id
      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      const data = await response.json()
      expect(data.is_owner).toBe(true)
    })

    it('returns is_owner=false when user is not the owner', async () => {
      mockUser = OTHER
      recipeOwner = OWNER.id
      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      const data = await response.json()
      expect(data.is_owner).toBe(false)
    })

    it('returns is_owner=true for legacy recipes (owner_id=null)', async () => {
      mockUser = OTHER
      recipeOwner = null
      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      const data = await response.json()
      expect(data.is_owner).toBe(true)
    })

    it('returns 404 when user has no link to the recipe', async () => {
      mockUser = OTHER
      userHasLink = false
      const { GET } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/recetas/[id]', () => {
    it('allows owner to edit', async () => {
      mockUser = OWNER
      recipeOwner = OWNER.id
      const { PUT } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated',
          description: '',
          image_url: null,
          meal_type: 'comida',
          prep_time: 30,
          servings: 4,
          calories: 500,
          ingredients: [],
          steps: [],
        }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      expect(response.status).toBe(200)
    })

    it('returns 403 when non-owner tries to edit', async () => {
      mockUser = OTHER
      recipeOwner = OWNER.id
      const { PUT } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Hacked' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      expect(response.status).toBe(403)
    })

    it('allows editing legacy recipes (owner_id=null)', async () => {
      mockUser = OTHER
      recipeOwner = null
      const { PUT } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated',
          description: '',
          image_url: null,
          meal_type: 'comida',
          prep_time: 30,
          servings: 4,
          calories: 500,
          ingredients: [],
          steps: [],
        }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/recetas/[id]', () => {
    it('owner can fully delete recipe', async () => {
      mockUser = OWNER
      recipeOwner = OWNER.id
      const { DELETE } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      expect(response.status).toBe(200)
      expect(deletedTable).toBe('recipes')
    })

    it('non-owner can only unlink (remove from user_recipes)', async () => {
      mockUser = OTHER
      recipeOwner = OWNER.id
      const { DELETE } = await import('@/app/api/recetas/[id]/route')
      const request = new NextRequest('http://localhost/api/recetas/recipe-1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'recipe-1' }) })
      expect(response.status).toBe(200)
      expect(deletedTable).toBe('user_recipes')
    })
  })
})
