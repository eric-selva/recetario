import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createQueryChain } from '../helpers/supabase-mock'

const USER_A = { id: 'user-a', email: 'a@test.com' }
const USER_B = { id: 'user-b', email: 'b@test.com' }

let mockUser: typeof USER_A | null = null
let userRecipeIds: string[] = []
let allRecipes: Array<{ id: string; title: string; meal_type: string }> = []

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
          eq: vi.fn().mockResolvedValue({
            data: userRecipeIds.map((id) => ({ recipe_id: id })),
            error: null,
          }),
        }),
      }
    }
    if (table === 'recipes') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn((col: string, ids: string[]) => ({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: allRecipes.filter((r) => ids.includes(r.id)),
                error: null,
                count: allRecipes.filter((r) => ids.includes(r.id)).length,
              }),
              eq: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: allRecipes.filter((r) => ids.includes(r.id)),
                  error: null,
                  count: allRecipes.filter((r) => ids.includes(r.id)).length,
                }),
              }),
              then: vi.fn(),
            }),
          })),
        }),
      }
    }
    return createQueryChain()
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

describe('Recipe visibility — users only see their own recipes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    allRecipes = [
      { id: 'demo-1', title: 'Paella (demo)', meal_type: 'comida' },
      { id: 'demo-2', title: 'Tortilla (demo)', meal_type: 'cena' },
      { id: 'user-a-recipe', title: 'Receta privada A', meal_type: 'comida' },
      { id: 'user-b-recipe', title: 'Receta privada B', meal_type: 'cena' },
    ]
  })

  it('User A sees demo recipes + their own, not User B recipes', async () => {
    mockUser = USER_A
    // User A has demo recipes + their own recipe
    userRecipeIds = ['demo-1', 'demo-2', 'user-a-recipe']

    const { GET } = await import('@/app/api/recetas/route')
    const request = new NextRequest('http://localhost/api/recetas')
    const response = await GET(request)
    const json = await response.json()

    expect(json.data).toHaveLength(3)
    const ids = json.data.map((r: { id: string }) => r.id)
    expect(ids).toContain('demo-1')
    expect(ids).toContain('demo-2')
    expect(ids).toContain('user-a-recipe')
    expect(ids).not.toContain('user-b-recipe')
  })

  it('User B sees demo recipes + their own, not User A recipes', async () => {
    mockUser = USER_B
    // User B has demo recipes + their own recipe
    userRecipeIds = ['demo-1', 'demo-2', 'user-b-recipe']

    const { GET } = await import('@/app/api/recetas/route')
    const request = new NextRequest('http://localhost/api/recetas')
    const response = await GET(request)
    const json = await response.json()

    expect(json.data).toHaveLength(3)
    const ids = json.data.map((r: { id: string }) => r.id)
    expect(ids).toContain('demo-1')
    expect(ids).toContain('demo-2')
    expect(ids).toContain('user-b-recipe')
    expect(ids).not.toContain('user-a-recipe')
  })

  it('returns empty when user has no linked recipes', async () => {
    mockUser = USER_A
    userRecipeIds = []

    const { GET } = await import('@/app/api/recetas/route')
    const request = new NextRequest('http://localhost/api/recetas')
    const response = await GET(request)
    const json = await response.json()

    expect(json.data).toEqual([])
    expect(json.total).toBe(0)
  })

  it('new recipe is linked only to creator via POST', async () => {
    mockUser = USER_A
    const insertedUserRecipe: { user_id: string; recipe_id: string }[] = []

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'recipes') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'new-recipe', title: 'Mi nueva receta' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'user_recipes') {
        return {
          insert: vi.fn((row: { user_id: string; recipe_id: string }) => {
            insertedUserRecipe.push(row)
            return Promise.resolve({ error: null })
          }),
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
        title: 'Mi nueva receta',
        description: '',
        image_url: null,
        meal_type: 'comida',
        prep_time: 20,
        servings: 4,
        calories: 300,
        ingredients: [{ name: 'Sal', quantity: 1, unit: 'g' }],
        steps: [{ instruction: 'Paso 1' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    // Verify user_recipes was called with creator's user_id
    expect(insertedUserRecipe).toHaveLength(1)
    expect(insertedUserRecipe[0].user_id).toBe(USER_A.id)
    expect(insertedUserRecipe[0].recipe_id).toBe('new-recipe')
  })
})
