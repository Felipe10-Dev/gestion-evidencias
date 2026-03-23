# Dashboard Web - Gestion de Evidencias

Aplicacion web administrativa para operar proyectos, equipos, usuarios y evidencias en tiempo real.

## Modulos principales

- Autenticacion y sesiones
- Dashboard con metricas
- Gestion de proyectos y equipos
- Gestion de evidencias y arbol de Drive
- Gestion de usuarios por rol

## Requisitos

- Node.js 18+
- npm 9+

## Configuracion

Crear frontend/.env.local con la URL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Ejecucion local

```bash
npm install
npm run dev
```

App web en: http://localhost:3001

## Build de produccion

```bash
npm run build
npm start
```

## Estructura tecnica

- pages: rutas de Next.js
- features: dominios de negocio (auth, dashboard, projects, evidences, users)
- components: layout y componentes UI reutilizables
- services/api: cliente HTTP y servicios desacoplados por recurso
- context: estado global (auth y toasts)
- hooks: hooks reutilizables de datos/estado

## Rutas funcionales

- /login
- /register
- /dashboard
- /proyectos
- /proyectos/nuevo
- /proyectos/[projectId]
- /proyectos/equipos/nuevo?projectId=<id>
- /evidencias
- /usuarios

## Convenciones del proyecto

- Imports absolutos via alias @/
- Logica de negocio dentro de features y services
- Pages como capa de enrutamiento y composicion
- Estado y notificaciones centralizados por contexto

## Integracion con backend

Dependencias de API esperadas:

- /api/auth/*
- /api/projects/*
- /api/teams/*
- /api/evidences/*

Recomendacion en produccion:

- Definir NEXT_PUBLIC_API_URL con dominio real del backend
- No exponer secretos en frontend
