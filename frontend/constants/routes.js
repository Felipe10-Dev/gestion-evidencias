const PUBLIC_ROUTES = ['/login']

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/proyectos': 'Proyectos',
  '/proyectos/nuevo': 'Nuevo Proyecto',
  '/proyectos/[projectId]': 'Detalle del Proyecto',
  '/proyectos/[projectId]/editar': 'Editar Proyecto',
  '/proyectos/equipos/nuevo': 'Nuevo Equipo',
  '/evidencias': 'Evidencias',
  '/usuarios': 'Usuarios',
}

export const SIDEBAR_LINKS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    matcher: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/proyectos',
    label: 'Proyectos',
    matcher: (pathname) => pathname.startsWith('/proyectos'),
  },
  {
    href: '/evidencias',
    label: 'Evidencias',
    matcher: (pathname) => pathname === '/evidencias',
  },
  {
    href: '/usuarios',
    label: 'Usuarios',
    matcher: (pathname) => pathname.startsWith('/usuarios'),
  },
]

export function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname)
}

export function getPageTitle(pathname) {
  return PAGE_TITLES[pathname] || 'Dashboard'
}