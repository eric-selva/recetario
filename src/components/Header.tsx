'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/recetas', label: 'Recetas' },
  { href: '/lista-compra', label: 'Lista de compra', showBadge: true },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    fetch('/api/lista-compra')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCartCount(data.length)
      })
      .catch(() => {})
  }, [pathname])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  function NavLink({ href, label, showBadge }: { href: string; label: string; showBadge?: boolean }) {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

    return (
      <Link
        href={href}
        className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-accent text-white'
            : 'text-muted hover:bg-accent-light/50 hover:text-foreground'
        }`}
      >
        {label}
        {showBadge && cartCount > 0 && (
          <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            isActive ? 'bg-white text-accent' : 'bg-accent text-white'
          }`}>
            {cartCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-accent">
          Mi Recetario
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 sm:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-accent-light/50 sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-border px-4 pb-4 sm:hidden">
          {navLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-accent-light/50 hover:text-foreground'
                }`}
              >
                {link.label}
                {link.showBadge && cartCount > 0 && (
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    isActive ? 'bg-white text-accent' : 'bg-accent text-white'
                  }`}>
                    {cartCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
