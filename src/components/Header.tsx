'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/recetas', label: 'Recetas' },
  { href: '/lista-compra', label: 'Lista de compra' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-accent">
          Mi Recetario
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-accent-light/50 hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-accent-light/50 hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
