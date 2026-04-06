"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const navLinks = [
  {
    href: "/recetas",
    label: "Recetas",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: "/despensa",
    label: "Despensa",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: "/lista-compra",
    label: "Lista",
    showBadge: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/recetario-home.png" alt="Recetario" width={140} height={22} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                isActive(link.href)
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-primary-light hover:text-primary"
              }`}
            >
              {link.icon}
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

        {/* Mobile menu button — spoon/fork icon */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-all hover:bg-primary-light sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className={`overflow-hidden border-t border-border/40 bg-card/80 backdrop-blur-md transition-all duration-300 ease-in-out sm:hidden ${
          menuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <nav className="px-4 pb-4">
          <div className="space-y-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-primary-light hover:text-primary"
                }`}
              >
                {link.icon}
                <span className="flex-1">{link.label}</span>
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
      </div>
    </header>
  );
}
