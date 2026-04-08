import { vi } from 'vitest'

// Chainable query builder that resolves to the given value
export function createQueryChain(resolvedValue: unknown = { data: null, error: null }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(resolvedValue)
      }
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

interface MockUser {
  id: string
  email: string
}

// Creates a mock supabase client with auth and from()
export function createMockSupabase(user: MockUser | null = null) {
  const fromHandlers: Record<string, () => unknown> = {}

  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn((table: string) => {
      if (fromHandlers[table]) return fromHandlers[table]()
      return createQueryChain({ data: [], error: null })
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return {
    supabase: mockSupabase,
    // Register a handler for a specific table
    onTable(table: string, handler: () => unknown) {
      fromHandlers[table] = handler
    },
  }
}

export const ADMIN_USER: MockUser = { id: 'admin-id', email: 'admin@test.com' }
export const REGULAR_USER: MockUser = { id: 'user-id', email: 'user@test.com' }
export const OTHER_USER: MockUser = { id: 'other-id', email: 'other@test.com' }

// Setup the supabase/server mock for API route tests
export function setupServerMock(user: MockUser | null = null) {
  const mock = createMockSupabase(user)

  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue(mock.supabase),
  }))

  return mock
}
