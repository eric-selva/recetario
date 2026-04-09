import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/Header'
import { mockFetch } from '../setup'

// Header returns null on "/" — mock pathname to "/recetas"
vi.mock('next/navigation', () => ({
  usePathname: () => '/recetas',
}))

// Mock supabase client (used by useSession)
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
        }),
      }),
    }),
  })),
}))

describe('Header', () => {
  beforeEach(() => {
    mockFetch({ '/api/lista-compra': [] })
  })

  it('renders the logo image', () => {
    render(<Header />)
    const logo = screen.getByAltText('Recetario')
    expect(logo).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<Header />)
    expect(screen.getAllByText('Recetas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Despensa').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lista').length).toBeGreaterThan(0)
  })

  it('toggles mobile menu on hamburger click', () => {
    render(<Header />)
    const button = screen.getByLabelText('Abrir menu')

    fireEvent.click(button)

    const allRecetasLinks = screen.getAllByText('Recetas')
    expect(allRecetasLinks.length).toBeGreaterThanOrEqual(2) // Desktop + mobile
  })

  it('shows cart badge when shopping list has items', async () => {
    mockFetch({ '/api/lista-compra': [{ id: '1', recipe_id: 'r1' }, { id: '2', recipe_id: 'r2' }] })
    render(<Header />)

    await vi.waitFor(() => {
      // Badge appears in both desktop and mobile nav
      const badges = screen.getAllByText('2')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })
})
