"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "@/hooks/useSession";

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
  const { user, isAdmin, signOut } = useSession();
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

  // Hide header on login and registration pages
  if (pathname === "/" || pathname === "/registro") return null;

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

        {/* Admin + Logout (desktop) */}
        <div className="hidden items-center gap-1 sm:flex">
          {isAdmin && (
            <Link
              href="/admin"
              className={`rounded-xl p-2 transition-all ${
                isActive("/admin")
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-primary-light hover:text-primary"
              }`}
              title="Admin"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          )}
          {user && (
            <button
              onClick={signOut}
              className="rounded-xl p-2 text-muted transition-all hover:bg-primary-light hover:text-primary"
              title="Cerrar sesion"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          )}
        </div>

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
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive("/admin")
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-primary-light hover:text-primary"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="flex-1 text-left">Admin</span>
              </Link>
            )}
            {user && (
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-primary-light hover:text-primary transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="flex-1 text-left">Cerrar sesion</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
