import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { getPageTitle, isPublicRoute, SIDEBAR_LINKS } from '@/constants/routes'
import { useAuth } from '@/context/auth/AuthContext'

function getNavItemClass(isActive) {
  if (isActive) {
    return 'group flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-900 shadow-sm'
  }

  return 'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/70 hover:text-slate-900'
}

function NavIcon({ href, isActive }) {
  const iconClassName = isActive
    ? 'h-4 w-4 text-blue-700'
    : 'h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600'

  if (href === '/dashboard') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={iconClassName}>
        <path d="M3 13.2c0-.7.3-1.4.8-1.8l6.8-6a2.1 2.1 0 0 1 2.8 0l6.8 6c.5.4.8 1.1.8 1.8v6a2 2 0 0 1-2 2h-3.8a1 1 0 0 1-1-1V16a1 1 0 0 0-1-1h-2.4a1 1 0 0 0-1 1v4.2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-6Z" />
      </svg>
    )
  }

  if (href === '/proyectos') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={iconClassName}>
        <path d="M3.5 7.5a2 2 0 0 1 2-2h4l1.2 1.5h7.8a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />
        <path d="M3.5 10.2h17" />
      </svg>
    )
  }

  if (href === '/usuarios') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={iconClassName}>
        <path d="M16 19a4 4 0 0 0-8 0" />
        <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={iconClassName}>
      <path d="M7.5 5.5h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
      <path d="M8.8 9.2h6.4M8.8 12h6.4M8.8 14.8h4.3" />
    </svg>
  )
}

function getRoleLabel(role) {
  if (role === 'admin') return 'Administrador'
  if (role === 'tecnico') return 'Tecnico'
  return role || 'Usuario'
}

function getUserInitials(name) {
  const normalizedName = (name || '').trim()
  if (!normalizedName) return 'US'

  const parts = normalizedName.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'US'
}

export function AppShell({ children }) {
  const router = useRouter()
  const { isAuthenticated, isReady, logout, user } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const userMenuRef = useRef(null)

  const isTechnician = user?.rol === 'tecnico'

  const canTechnicianAccessPath = (pathname) => (
    pathname === '/proyectos' || pathname === '/proyectos/[projectId]'
  )

  const isBlockedForTechnician = isTechnician && !canTechnicianAccessPath(router.pathname)

  useEffect(() => {
    if (!isReady || isPublicRoute(router.pathname)) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!['admin', 'tecnico'].includes(user?.rol)) {
      logout()
      router.push('/login')
      return
    }

    if (isBlockedForTechnician) {
      router.push('/proyectos')
    }
  }, [isAuthenticated, isReady, isBlockedForTechnician, logout, router, user?.rol])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [router.pathname])

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileNavOpen])

  if (isPublicRoute(router.pathname)) {
    return children
  }

  if (!isReady || !isAuthenticated || !['admin', 'tecnico'].includes(user?.rol)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="panel-surface animated-in rounded-2xl px-8 py-5 text-sm font-semibold text-slate-700">
          Cargando panel...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className={`fixed inset-0 z-40 transition ${isMobileNavOpen ? 'pointer-events-auto lg:pointer-events-none' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsMobileNavOpen(false)}
          className={`absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] transition duration-200 lg:hidden ${isMobileNavOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        <aside
          className={`absolute left-0 top-0 h-full w-[86vw] max-w-sm border-r border-blue-100 bg-gradient-to-b from-slate-50 to-blue-50/70 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] transition-transform duration-300 ease-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="panel-surface px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sistema</p>
                <h1 className="mt-2 text-xl font-bold text-slate-900">Gestor Evidencias</h1>
                <p className="mt-1 text-sm text-slate-600">Panel operativo</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-blue-300 hover:text-blue-700"
                aria-label="Cerrar navegación"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="mt-5 space-y-2">
            {SIDEBAR_LINKS.map((item) => (
              isTechnician && item.href !== '/proyectos' ? (
                <div
                  key={item.href}
                  className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400"
                  title="Disponible solo para admin"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
                    <NavIcon href={item.href} isActive={false} />
                  </span>
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    solo admin
                  </span>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={getNavItemClass(item.matcher(router.pathname))}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-blue-100">
                    <NavIcon href={item.href} isActive={item.matcher(router.pathname)} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </nav>

        </aside>
      </div>

      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-blue-100 bg-gradient-to-b from-slate-50 to-blue-50/40 px-4 py-6 lg:flex">
          <div className="panel-surface px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sistema
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Gestor Evidencias</h1>
            <p className="mt-2 text-sm text-slate-600">Panel operativo</p>
          </div>

          <nav className="mt-5 flex-1 space-y-2">
            {SIDEBAR_LINKS.map((item) => (
              isTechnician && item.href !== '/proyectos' ? (
                <div
                  key={item.href}
                  className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400"
                  title="Disponible solo para admin"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
                    <NavIcon href={item.href} isActive={false} />
                  </span>
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    solo admin
                  </span>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={getNavItemClass(item.matcher(router.pathname))}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-blue-100">
                    <NavIcon href={item.href} isActive={item.matcher(router.pathname)} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-700 lg:hidden"
                    aria-label="Abrir navegación"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17h10" />
                    </svg>
                  </button>

                  <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Panel Administrativo
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-semibold leading-none text-slate-800 md:text-[2rem]">
                    {getPageTitle(router.pathname)}
                  </h2>
                  <span className="mt-3 block h-1 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-300" />
                  </div>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((current) => !current)}
                    className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-700"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Abrir menú de usuario"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600"
                    >
                      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                      <path d="M4 20a8 8 0 0 1 16 0" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="panel-surface absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.55)]" role="menu">
                      <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-bold text-white shadow-sm">
                          {getUserInitials(user?.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{user?.nombre || 'Usuario'}</p>
                          <p className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                            {getRoleLabel(user?.rol)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          logout()
                          router.push('/login')
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                        role="menuitem"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          className="h-4 w-4 text-slate-400"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h10" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="m17 7 5 5-5 5" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="animated-in mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}