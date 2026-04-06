import '@testing-library/jest-dom/vitest'

// Mock IntersectionObserver (not available in jsdom)
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock ResizeObserver (not available in jsdom)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({ id: 'test-id' }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props
    return <img {...rest} data-fill={fill ? 'true' : undefined} data-priority={priority ? 'true' : undefined} />
  },
}))

// Mock boneyard-js/react
vi.mock('boneyard-js/react', () => ({
  Skeleton: ({ loading, children, fixture }: { loading: boolean; children: React.ReactNode; fixture?: React.ReactNode }) => {
    if (loading && fixture) return <div data-testid="skeleton">{fixture}</div>
    if (loading) return <div data-testid="skeleton">Loading...</div>
    return <>{children}</>
  },
}))

// Global fetch mock helper
export function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0]
    const data = responses[path] ?? []
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    })
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}
