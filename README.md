# Gestion de Evidencias

Plataforma para registrar, organizar y consultar evidencias tecnicas por proyecto y equipo, con operacion en campo (app movil) y administracion centralizada (dashboard web).

## Resumen

Este repositorio incluye tres aplicaciones coordinadas:

- Backend API (Node.js + Express + PostgreSQL)
- Dashboard web (Next.js)
- App movil para tecnicos (Flutter)

Casos de uso principales:

- Gestion de proyectos y equipos
- Carga y consulta de evidencias por etapa
- Autenticacion por roles (admin y tecnico)
- Integracion con Google Drive para almacenamiento

## Stack

- Backend: Node.js, Express 5, Sequelize, PostgreSQL, JWT, Joi, Helmet
- Frontend: Next.js 14, React 18, Tailwind CSS, Axios
- Mobile: Flutter, Dart, http, image_picker, shared_preferences

## Estructura del repositorio

- backend: API REST, reglas de negocio, modelos, seguridad e integraciones
- frontend: dashboard administrativo para operacion y gestion
- mobile-app: app de campo para carga y consulta operativa
- docs: arquitectura, esquema de datos y guias de publicacion segura

## Requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Flutter SDK (solo para mobile)

## Inicio rapido

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend por defecto: http://localhost:3000

Health checks:

- GET /health
- GET /health/db

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend por defecto: http://localhost:3001

### 3. Mobile

```bash
cd mobile-app
flutter pub get
flutter run
```

## Pruebas y calidad

Backend:

```bash
cd backend
npm test
```

Frontend (build de produccion):

```bash
cd frontend
npm run build
```

Mobile (tests):

```bash
cd mobile-app
flutter test
```

## Despliegue recomendado

1. Crear infraestructura del cliente (DB, servidor, dominio, SSL)
2. Cargar variables en entorno de produccion (no en Git)
3. Conectar Google Drive de la empresa (no cuentas personales)
4. Validar endpoints de salud y flujo completo
5. Activar backups y monitoreo

Referencia de despliegue backend:

- backend/DEPLOY_CHECKLIST.md

## Seguridad y secretos

- No subir .env ni credenciales
- Rotar JWT y credenciales al pasar a produccion
- Usar variables de entorno del proveedor (Railway, Render, etc.)

## Documentacion

- docs/system-architecture.md
- docs/database-schema.md
- docs/project-context.md
- docs/guia-publicacion-segura-es.md

## Checklist de demo (reunion comercial)

- Login admin y login tecnico
- Crear proyecto y equipo
- Crear referencia y subir evidencia
- Ver evidencia en web y en mobile
- Eliminar evidencia/carpeta y validar sincronizacion
- Mostrar /health y /health/db

## Estado del proyecto

MVP funcional y listo para despliegue empresarial con dominio e infraestructura del cliente.
