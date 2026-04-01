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

## Google Drive

### Produccion (recomendado): Service Account (estable)

Para venderlo sin caidas por tokens, lo mas estable es usar una **cuenta de servicio** y una **Unidad compartida (Shared Drive)**. Comparte la carpeta raiz con el correo `...@...iam.gserviceaccount.com` (permiso **Editor**).

Nota: En Drive personal ("Mi unidad"), una service account puede listar si le compartes, pero **no puede subir archivos** (no tiene cuota). En ese caso usa OAuth.

Variables recomendadas:

- GOOGLE_DRIVE_AUTH_MODE=service_account
- GOOGLE_DRIVE_FOLDER_ID

Credencial (elige una):

- GOOGLE_DRIVE_CREDENTIALS_JSON (JSON directo o base64 del JSON)
- GOOGLE_DRIVE_CREDENTIALS_PATH (solo si el proveedor permite archivos)

### OAuth (opcional): cuenta personal (puede revocarse/expirar)

Si quieres operar con OAuth2 (cuenta personal), define estas variables:

- GOOGLE_DRIVE_AUTH_MODE=oauth
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_CLIENT_SECRET
- GOOGLE_OAUTH_REFRESH_TOKEN

Generar refresh token (local):

```bash
node scripts/generateDriveRefreshToken.js
```

Notas importantes (no hay garantia de “nunca expira”):

- Publica/ajusta la pantalla OAuth consent para que no quede en modo de pruebas con usuarios limitados.
- Solicita siempre offline access al generar el token (access_type=offline y prompt=consent).
- No regeneres tokens muchas veces con el mismo usuario/cliente OAuth (Google puede revocar los anteriores).
- Si cambias credenciales OAuth (client secret/client id), regenera el refresh token.

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
