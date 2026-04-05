import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('API /api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns ok:true with correct password', async () => {
    const { POST } = await import('@/app/api/auth/route')
    const request = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password: 'le2512' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
  })

  it('returns 401 with wrong password', async () => {
    const { POST } = await import('@/app/api/auth/route')
    const request = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.ok).toBe(false)
  })
})
