'use client'

import { useState, useEffect } from 'react'

const AUTH_KEY = 'recetario-auth'

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setIsAuthed(localStorage.getItem(AUTH_KEY) === '1')
  }, [])

  async function login(password: string): Promise<boolean> {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      localStorage.setItem(AUTH_KEY, '1')
      setIsAuthed(true)
      return true
    }

    return false
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    setIsAuthed(false)
  }

  return { isAuthed, login, logout }
}
