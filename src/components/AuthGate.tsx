'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isAuthed === false && pathname !== '/') {
      router.replace('/')
    }
  }, [isAuthed, pathname, router])

  // Still loading from localStorage
  if (isAuthed === null) return null

  // Not authed and not on home — will redirect
  if (!isAuthed && pathname !== '/') return null

  return <>{children}</>
}
