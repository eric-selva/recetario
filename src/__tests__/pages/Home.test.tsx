import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'
import { mockFetch } from '../setup'

describe('Home Page', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch({ '/api/auth': { ok: true } })
  })

  describe('when not authenticated', () => {
    it('shows password form', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Clave de acceso')).toBeInTheDocument()
      })
    })

    it('shows "Entrar" button', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByText('Entrar')).toBeInTheDocument()
      })
    })

    it('does not show hero content', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Clave de acceso')).toBeInTheDocument()
      })
      expect(screen.queryByText('Ver recetas')).not.toBeInTheDocument()
    })

    it('shows error on wrong password', async () => {
      mockFetch({ '/api/auth': { ok: false } })
      // Override fetch to return 401
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ ok: false }),
        }),
      ) as unknown as typeof fetch

      render(<Home />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Clave de acceso')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Clave de acceso')
      fireEvent.change(input, { target: { value: 'wrong' } })
      fireEvent.submit(input.closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Clave incorrecta')).toBeInTheDocument()
      })
    })
  })

  describe('when authenticated', () => {
    beforeEach(() => {
      localStorage.setItem('recetario-auth', '1')
    })

    it('renders the hero title', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByText('Recetario')).toBeInTheDocument()
      })
    })

    it('renders hero description', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByText(/Tu cocina, tus recetas/)).toBeInTheDocument()
      })
    })

    it('renders CTA buttons', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByText('Ver recetas')).toBeInTheDocument()
        expect(screen.getByText('Lista de compra')).toBeInTheDocument()
      })
    })

    it('links to correct pages', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByText('Ver recetas')).toBeInTheDocument()
      })
      const links = screen.getAllByRole('link')
      const hrefs = links.map((l) => l.getAttribute('href'))
      expect(hrefs).toContain('/recetas')
      expect(hrefs).toContain('/lista-compra')
    })

    it('does not show password form', async () => {
      render(<Home />)
      await waitFor(() => {
        expect(screen.getByText('Ver recetas')).toBeInTheDocument()
      })
      expect(screen.queryByPlaceholderText('Clave de acceso')).not.toBeInTheDocument()
    })
  })
})
