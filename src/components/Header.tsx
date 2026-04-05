"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/recetas", label: "Recetas" },
  { href: "/despensa", label: "Despensa" },
  { href: "/lista-compra", label: "Lista de compra", showBadge: true },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch("/api/lista-compra")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCartCount(data.length);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Hide header on the home page
  if (pathname === "/") return null;

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Recetario" width={32} height={32} />
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            Recetario
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                isActive(link.href)
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-primary-light hover:text-primary"
              }`}
            >
              {link.label}
              {link.showBadge && cartCount > 0 && (
                <span
                  className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive(link.href)
                      ? "bg-saffron text-foreground"
                      : "bg-primary text-white"
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-primary-light hover:text-primary sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-border/60 px-4 pb-4 sm:hidden">
          <div className="space-y-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-primary-light hover:text-primary"
                }`}
              >
                {link.label}
                {link.showBadge && cartCount > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      isActive(link.href)
                        ? "bg-saffron text-foreground"
                        : "bg-primary text-white"
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
