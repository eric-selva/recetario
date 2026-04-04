import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Toast from '@/components/Toast'

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Receta añadida" onClose={vi.fn()} />)
    expect(screen.getByText('Receta añadida')).toBeInTheDocument()
  })

  it('renders success style by default', () => {
    render(<Toast message="OK" onClose={vi.fn()} />)
    const toast = screen.getByText('OK').closest('div')
    expect(toast?.className).toContain('bg-green-600')
  })

  it('renders error style when type is error', () => {
    render(<Toast message="Error" type="error" onClose={vi.fn()} />)
    const toast = screen.getByText('Error').closest('div')
    expect(toast?.className).toContain('bg-red-600')
  })

  it('calls onClose after timeout', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} />)

    vi.advanceTimersByTime(3500)
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
