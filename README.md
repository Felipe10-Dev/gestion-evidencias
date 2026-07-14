<div align="center">

# 📋 Sistema de Gestión de Evidencias Técnicas

**Plataforma multi-plataforma para registrar, organizar y consultar evidencias fotográficas de trabajos técnicos en campo**

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Flutter-3-02569B?logo=flutter&logoColor=white" alt="Flutter">
  <img src="https://img.shields.io/badge/Dart-3.11-0175C2?logo=dart&logoColor=white" alt="Dart">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Google_Drive_API-4285F4?logo=googledrive&logoColor=white" alt="Google Drive">
  <img src="https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize&logoColor=white" alt="Sequelize">
  <img src="https://img.shields.io/badge/JWT-auth-EB5424?logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white" alt="Jest">
  <img src="https://img.shields.io/badge/license-ISC-blue" alt="License">
</p>

<p align="center">
  <a href="#-descripcion">Descripción</a> •
  <a href="#-arquitectura">Arquitectura</a> •
  <a href="#-stack-tecnologico">Stack</a> •
  <a href="#-modelo-de-datos">Modelo de datos</a> •
  <a href="#-inicio-rapido">Inicio rápido</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-pruebas">Pruebas</a> •
  <a href="#-despliegue">Despliegue</a>
</p>

</div>

---

## 📖 Descripción

Muchas empresas que realizan trabajos técnicos en campo necesitan **registrar evidencia fotográfica** de sus intervenciones. Actualmente usan WhatsApp, carpetas desordenadas en Google Drive o discos locales, lo que genera:

| Problema | Impacto |
|----------|---------|
| ❌ Pérdida de evidencias | Sin respaldo estructurado |
| ❌ Desorden en fotografías | Sin clasificación por proyecto/etapa |
| ❌ Dificultad para consultar | Sin búsqueda ni filtros |
| ❌ Falta de control | Sin trazabilidad de quién sube qué |

**Gestion de Evidencias** resuelve esto con un sistema digital completo que permite a los **técnicos en campo** capturar y subir fotos desde su dispositivo móvil, y a los **administradores** gestionar proyectos, equipos y revisar evidencias desde un dashboard web centralizado.

### ✨ Funcionalidades clave

- **Autenticación por roles** — Administrador y Técnico con JWTs
- **Gestión de proyectos** — CRUD completo con organización por equipos
- **Carga de evidencias** — Clasificadas por etapa (`antes` / `durante` / `despues`)
- **Almacenamiento en Google Drive** — Cada proyecto y equipo tiene su propia carpeta
- **Dashboard web** — Panel administrativo con Next.js y Tailwind CSS
- **App móvil** — Para técnicos en campo con Flutter
- **API REST segura** — Validación Joi, SQL injection guard, rate limiting, Helmet
- **CI/CD** — GitHub Actions con tests automáticos

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    APP MÓVIL (Flutter)                       │
│          Técnicos en campo — captura y subida de fotos       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS / REST API
                           │ JWT Auth
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (Node.js + Express 5)               │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth     │  │ Projects │  │ Teams    │  │Evidence  │   │
│  │ Controller│  │ Controller│  │Controller│  │Controller│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │Models    │  │Services  │  │Middlewares: Auth, Roles,  │  │
│  │(Sequelize)│  │(Drive,   │  │Validation, Rate Limit,   │  │
│  │          │  │ Upload)  │  │SQL Injection Guard       │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└─────────┬────────────────────────┬─────────────────────────┘
          │                        │
          ▼                        ▼
┌──────────────────┐   ┌──────────────────────────┐
│   PostgreSQL 14+  │   │   Google Drive API       │
│   (Sequelize ORM)  │   │   (OAuth2 / Service Acct)│
│                   │   │   Almacenamiento de       │
│  4 tablas:        │   │   imágenes por proyecto   │
│  usuarios         │   │   y equipo                │
│  proyectos        │   │                          │
│  equipos          │   │                          │
│  evidencias       │   │                          │
└──────────────────┘   └──────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD WEB (Next.js 15 + React 18)          │
│          Administradores — gestión y visualización           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 Stack Tecnológico

### Backend

| Categoría | Tecnología | Propósito |
|-----------|-----------|-----------|
| Runtime | **Node.js 18+** | Entorno JavaScript |
| Framework | **Express 5** | API REST |
| ORM | **Sequelize 6** | Mapeo objeto-relacional |
| Base de datos | **PostgreSQL 14+** | Persistencia |
| Autenticación | **JWT** + **bcrypt** | Tokens + hash de contraseñas |
| Validación | **Joi** | Schemas de validación |
| Subida de archivos | **Multer** | Multipart uploads (memory storage, 10MB) |
| Cloud Storage | **Google Drive API** (`googleapis`) | Almacenamiento de imágenes |
| Seguridad | **Helmet**, **express-rate-limit**, SQL injection guard | Protección |
| Pruebas | **Jest** + **Supertest** | Tests de integración |

### Frontend Web

| Categoría | Tecnología |
|-----------|-----------|
| Framework | **Next.js 15** (Pages Router) |
| UI | **React 18** |
| Estilos | **Tailwind CSS 3** |
| HTTP | **Axios** (con interceptor JWT) |
| Analytics | **@vercel/analytics**, **@vercel/speed-insights** |

### Mobile App

| Categoría | Tecnología |
|-----------|-----------|
| Framework | **Flutter 3** |
| Lenguaje | **Dart 3.11+** |
| HTTP | `http` package |
| Cámara/Galería | `image_picker` |
| Almacenamiento local | `shared_preferences` |

### DevOps

| Categoría | Tecnología |
|-----------|-----------|
| CI/CD | **GitHub Actions** |
| Control de versiones | **Git** |

---

## 📊 Modelo de Datos

```
┌──────────────────┐       ┌──────────────────┐
│    usuarios      │       │   proyectos      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ nombre           │       │ nombre           │
│ email (unique)   │       │ descripcion      │
│ password (hash)  │       │ drive_folder_id  │
│ rol (admin|tecnico)│     │ createdAt        │
│ createdAt        │       │ updatedAt        │
│ updatedAt        │       └────────┬─────────┘
└──────────────────┘                │
                                    │ 1
                                    │
                                    │ *
          ┌─────────────────────────┘
          ▼
     ┌──────────────────┐
     │     equipos      │       ┌──────────────────┐
     ├──────────────────┤       │   evidencias     │
     │ id (PK)          │       ├──────────────────┤
     │ nombre           │       │ id (PK)          │
     │ drive_folder_id  │       │ descripcion      │
     │ ProjectId (FK)───┼──┐    │ etapa (antes|durante|despues)│
     │ createdAt        │  │    │ drive_url         │
     │ updatedAt        │  │    │ drive_file_id     │
     └──────────────────┘  │    │ drive_folder_id   │
                           │    │ TeamId (FK)───────┼──┐
                           │    │ UserId (FK)───────┼──┤
                           │    │ createdAt         │  │
                           │    │ updatedAt         │  │
                           │    └──────────────────┘  │
                           │                          │
                           └──────────────────────────┘
```

### Relaciones

- **Proyecto** 1 → * **Equipos** (un proyecto tiene muchos equipos)
- **Equipo** 1 → * **Evidencias** (un equipo tiene muchas evidencias)
- **Usuario** 1 → * **Evidencias** (un usuario puede subir muchas evidencias)

### Etapas de evidencia

| Etapa | Significado |
|-------|-------------|
| `antes` | Fotografía del estado previo al trabajo |
| `durante` | Fotografía durante la ejecución |
| `despues` | Fotografía del resultado final |

### Roles del sistema

| Rol | Acceso web | Acceso móvil | Permisos |
|-----|-----------|-------------|----------|
| **admin** | ✅ Dashboard completo | ✅ | CRUD proyectos, equipos, evidencias, usuarios |
| **tecnico** | ❌ | ✅ | Ver proyectos, crear equipos, subir evidencias |

---

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ y npm 9+
- PostgreSQL 14+
- Flutter SDK 3.x (solo para desarrollo móvil)
- Una cuenta de Google Cloud con Drive API habilitada (opcional para desarrollo local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/gestion-evidencias.git
cd gestion-evidencias
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env` con tus credenciales de base de datos y Google Drive:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/gestion_evidencias
JWT_SECRET=tu_secreto_super_seguro
```

Para desarrollo sin Google Drive, el sistema funcionará en modo degradado.

```bash
npm run dev
```

El backend arrancará en **http://localhost:3000** y ejecutará migraciones automáticas.

### 3. Frontend Web

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend disponible en **http://localhost:3001**.

### 4. Mobile App

```bash
cd mobile-app
flutter pub get
flutter run
```

Asegúrate de tener un emulador abierto o un dispositivo conectado.

### Variables de entorno

#### Backend (`.env`)

| Variable | Descripción | Obligatorio |
|----------|-------------|:-----------:|
| `PORT` | Puerto del servidor | Sí |
| `DATABASE_URL` | URL completa de conexión a PostgreSQL | Sí* |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión por partes (alternativa a URL) | Sí* |
| `DB_SSL` | Forzar SSL en DB (auto en producción) | No |
| `DB_RUN_MIGRATIONS` | Ejecutar migraciones al iniciar | No |
| `DB_SYNC_ALTER` | Sincronizar esquema (no recomendado en prod) | No |
| `JWT_SECRET` | Secreto para firmar tokens | Sí |
| `GOOGLE_DRIVE_AUTH_MODE` | `oauth` o `service_account` | No |
| `GOOGLE_DRIVE_FOLDER_ID` | ID carpeta raíz en Drive | No |
| `GOOGLE_DRIVE_CLIENT_ID` | Client ID OAuth | No |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Client Secret OAuth | No |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Refresh Token OAuth | No |

#### Frontend (`.env.local`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL base de la API backend (ej: `http://localhost:3000/api`) |

---

## 📡 API Endpoints

### Autenticación

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|:----:|:---:|
| `POST` | `/api/auth/login` | Iniciar sesión | ❌ | - |
| `POST` | `/api/auth/register` | Registrar usuario | ❌ | - |

### Proyectos

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|:----:|:---:|
| `GET` | `/api/projects` | Listar proyectos | ✅ | admin, tecnico |
| `POST` | `/api/projects` | Crear proyecto | ✅ | admin |
| `GET` | `/api/projects/:id` | Ver detalle de proyecto | ✅ | admin, tecnico |
| `PUT` | `/api/projects/:id` | Actualizar proyecto | ✅ | admin |
| `DELETE` | `/api/projects/:id` | Eliminar proyecto (+ Drive) | ✅ | admin |

### Equipos (Teams)

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|:----:|:---:|
| `GET` | `/api/teams?projectId=` | Listar equipos por proyecto | ✅ | admin, tecnico |
| `POST` | `/api/teams` | Crear equipo | ✅ | admin, tecnico |
| `GET` | `/api/teams/:id` | Ver detalle de equipo | ✅ | admin, tecnico |
| `PUT` | `/api/teams/:id` | Actualizar equipo | ✅ | admin |
| `DELETE` | `/api/teams/:id` | Eliminar equipo (+ Drive) | ✅ | admin |

### Evidencias

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|:----:|:---:|
| `GET` | `/api/evidences?teamId=&etapa=` | Listar evidencias | ✅ | admin, tecnico |
| `POST` | `/api/evidences` | Subir evidencia (multipart) | ✅ | admin, tecnico |
| `DELETE` | `/api/evidences/:id` | Eliminar evidencia (+ Drive) | ✅ | admin |

### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Estado del API |
| `GET` | `/health` | Health check completo |
| `GET` | `/health/db` | Estado de la base de datos |

### Seguridad implementada

- ✅ **JWT** en cada request autenticado (header `Authorization: Bearer <token>`)
- ✅ **Rate limiting** en login (evita brute-force)
- ✅ **Helmet** (headers de seguridad HTTP)
- ✅ **SQL Injection Guard** (middleware personalizado)
- ✅ **Validación Joi** en body, params y query
- ✅ **Roles** (middleware que restringe endpoints por `admin`/`tecnico`)
- ✅ **Normalización de errores** (formato consistente)

---

## 🧪 Pruebas

### Backend (Jest + Supertest)

```bash
cd backend
npm test
```

Incluye tests de seguridad que verifican:
- Rechazo de campos desconocidos en payloads
- Validación de roles
- Validación de parámetros de consulta
- Limpieza de conexiones después de los tests

### Frontend (build check)

```bash
cd frontend
npm run build
```

### Mobile (Flutter test)

```bash
cd mobile-app
flutter test
```

### CI/CD

El repositorio incluye **GitHub Actions** (`.github/workflows/ci.yml`) que ejecuta:

- **Backend tests** con Node 20
- **Frontend build** con Node 20

Se activa en pushes a `main`/`master` y en Pull Requests.

---

## 📦 Scripts Disponibles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar con nodemon (desarrollo) |
| `npm start` | Iniciar en producción |
| `npm test` | Ejecutar tests |
| `npm run db:create` | Crear base de datos |
| `npm run db:inspect` | Inspeccionar esquema actual |
| `npm run db:seed` | Sembrar usuarios de prueba |
| `npm run db:single-tenant:plan` | Planificar limpieza multi-tenant |
| `npm run code:audit` | Auditar código no utilizado |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Iniciar servidor de producción |
| `npm run lint` | Linter |

---

## ☁️ Google Drive Integration

El sistema almacena las imágenes directamente en Google Drive con la siguiente estructura de carpetas:

```
📁 Drive Raíz (GOOGLE_DRIVE_FOLDER_ID)
├── 📁 Proyecto A
│   ├── 📁 Equipo 1
│   │   ├── 🖼 antes_foto1.jpg
│   │   ├── 🖼 durante_foto1.jpg
│   │   └── 🖼 despues_foto1.jpg
│   ├── 📁 Equipo 2
│   └── ...
├── 📁 Proyecto B
└── ...
```

### Configuración

1. Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar **Google Drive API**
3. Crear credenciales **OAuth 2.0** o **Service Account**
4. Ejecutar el script de generación de tokens:

```bash
cd backend
node scripts/generateDriveAuthUrl.js
# Sigue las instrucciones para obtener el refresh token
```

**Modos soportados:**
- `oauth` — Usa OAuth 2.0 con refresh token (recomendado para cuentas personales)
- `service_account` — Usa Service Account (recomendado para cuentas empresariales)

---

## 🌐 Despliegue

### Recomendaciones para producción

1. **Infraestructura**
   - Servidor VPS o cloud (Railway, Render, AWS, GCP)
   - PostgreSQL manejado (Supabase, Railway, AWS RDS)
   - Dominio personalizado con SSL

2. **Seguridad**
   - Rotar JWT_SECRET y credenciales de Google Drive
   - Usar variables de entorno del proveedor (no `.env` en Git)
   - Activar `DB_SSL=true` en producción
   - Deshabilitar `DB_SYNC_ALTER`

3. **Google Drive**
   - Usar cuenta institucional de Google Workspace
   - Configurar Service Account para permisos granulares

4. **Monitoreo**
   - Verificar endpoints `/health` y `/health/db`
   - Activar backups automáticos de la base de datos
   - Configurar alertas de caída del servicio

5. **Checklist de demo comercial**
   - [ ] Login admin y login técnico
   - [ ] Crear proyecto y equipo
   - [ ] Crear referencia y subir evidencia
   - [ ] Visualizar evidencia en web y en móvil
   - [ ] Eliminar evidencia/carpeta y validar sincronización
   - [ ] Mostrar `/health` y `/health/db`

---

## 📁 Estructura del Repositorio

```
gestion-evidencias/
├── backend/                  # API REST (Node.js + Express + Sequelize)
│   ├── src/
│   │   ├── config/           # Config (DB, Google Drive, Multer)
│   │   ├── controllers/      # Controladores (auth, project, team, evidence)
│   │   ├── middlewares/       # Auth, roles, validación, rate limit, SQL guard
│   │   ├── models/           # Sequelize models (User, Project, Team, Evidence)
│   │   ├── routes/           # Definición de rutas
│   │   ├── services/         # Lógica de negocio (Drive, upload, delete)
│   │   ├── repositories/     # Acceso a datos
│   │   ├── validation/       # Schemas Joi
│   │   ├── utils/            # Utilidades (paginación, scopes)
│   │   └── db/               # Migraciones
│   ├── scripts/              # Utilidades (seed, drive auth, DB inspect)
│   └── tests/                # Tests (Jest + Supertest)
│
├── frontend/                 # Dashboard web (Next.js 15 + React + Tailwind)
│   ├── components/           # Componentes UI y layout
│   ├── features/             # Módulos (auth, dashboard, projects, evidences)
│   ├── pages/                # Páginas Next.js (routes)
│   ├── services/api/         # Clientes HTTP (Axios)
│   ├── context/              # Contextos (Auth, Toast)
│   ├── hooks/                # Custom hooks
│   └── utils/                # Utilidades (localStorage)
│
├── mobile-app/               # App móvil (Flutter)
│   ├── lib/
│   │   ├── app/              # App widget, session gate
│   │   ├── core/             # Tema, widgets compartidos
│   │   ├── data/             # Modelos y servicios (API, session)
│   │   └── features/         # Pantallas (login, home, projects, teams, evidences)
│   ├── android/              # Configuración nativa Android
│   ├── ios/                  # Configuración nativa iOS
│   └── test/                 # Tests
│
├── docs/                     # Documentación
│   ├── system-architecture.md
│   ├── database-schema.md
│   ├── project-context.md
│   ├── cursor-rules.md
│   └── guia-publicacion-segura-es.md
│
├── .github/workflows/        # CI/CD (GitHub Actions)
└── README.md                 # Este archivo
```

---

## 📚 Documentación Adicional

- [`docs/system-architecture.md`](docs/system-architecture.md) — Diagrama de arquitectura y descripción de componentes
- [`docs/database-schema.md`](docs/database-schema.md) — Esquema detallado de la base de datos
- [`docs/project-context.md`](docs/project-context.md) — Contexto del problema y solución
- [`docs/cursor-rules.md`](docs/cursor-rules.md) — Convenciones de código para desarrolladores
- [`docs/guia-publicacion-segura-es.md`](docs/guia-publicacion-segura-es.md) — Guía para publicar el repositorio de forma segura
- [`backend/README.md`](backend/README.md) — Documentación específica del backend
- [`frontend/README.md`](frontend/README.md) — Documentación específica del frontend
- [`mobile-app/README.md`](mobile-app/README.md) — Documentación específica de la app móvil

---

## 🤝 Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Convenciones de código

Este proyecto sigue las convenciones definidas en [`docs/cursor-rules.md`](docs/cursor-rules.md):
- Arquitectura MVC
- Código modular con responsabilidades claras
- Middleware para validación y seguridad
- Manejo consistente de errores
- Nombres en español para el dominio de negocio

---

## 📄 Licencia

Distribuido bajo licencia **ISC**. Ver `backend/package.json` para referencia.

---

## 👥 Autores

- **Equipo de desarrollo** — Trabajo inicial

---

<div align="center">

**Hecho con ❤️ para empresas que hacen trabajo técnico en campo**

¿Preguntas o sugerencias? ¡Abre un issue!

</div>
