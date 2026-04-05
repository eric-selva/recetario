import type { NextRequest } from 'next/server'

const PASSWORD = process.env.APP_PASSWORD || 'le2512'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password === PASSWORD) {
    return Response.json({ ok: true })
  }

  return Response.json({ ok: false }, { status: 401 })
}
