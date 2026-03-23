# Backend API - Gestion de Evidencias

Servicio REST para autenticacion, gestion de proyectos/equipos/evidencias e integracion con Google Drive.

## Stack

- Node.js + Express 5
- PostgreSQL + Sequelize
- JWT para autenticacion
- Joi para validacion
- Helmet y middlewares de seguridad

## Requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Configuracion

1. Copiar variables base:

```bash
cp .env.example .env
```

2. Configurar valores en .env:

- PORT
- JWT_SECRET
- DATABASE_URL o DB_* / PG*
- Credenciales de Google Drive

## Ejecucion local

```bash
npm install
npm run dev
```

Servidor por defecto: http://localhost:3000

## Endpoints de salud

- GET /
- GET /health
- GET /health/db

## Scripts

```bash
npm run dev
npm start
npm test
```

## Rutas API principales

- /api/auth
- /api/projects
- /api/teams
- /api/evidences

## Seguridad

- No subir .env ni credenciales de Drive
- Usar variables de entorno del proveedor
- Rotar secretos en cada despliegue productivo

## Despliegue

Guia recomendada:

- DEPLOY_CHECKLIST.md

Flujo recomendado:

1. Configurar variables en Railway/servidor
2. Validar /health y /health/db
3. Probar login y flujo de evidencias
4. Activar backups y monitoreo
