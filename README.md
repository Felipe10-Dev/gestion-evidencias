# Gestion de Evidencias

Sistema para registrar, organizar y consultar evidencias tecnicas por proyecto y equipo, con uso operativo en campo y administracion centralizada.

## Que resuelve

Este proyecto permite:

- Mantener trazabilidad de evidencias por proyecto, equipo y usuario
- Centralizar carga y consulta de evidencias desde web y movil
- Aplicar autenticacion y control de acceso por roles
- Conectar operacion tecnica con seguimiento administrativo

## Stack validado del proyecto

Backend:

- Node.js
- Express 5
- Sequelize
- PostgreSQL
- JWT, Joi, Helmet, Rate Limiting

Frontend web:

- Next.js 14
- React 18
- Tailwind CSS
- Axios

Aplicacion movil:

- Flutter (Dart)
- HTTP, Image Picker, Shared Preferences

## Arquitectura por modulos

- backend: API REST, autenticacion, reglas de negocio, base de datos y servicios de archivos
- frontend: dashboard web para gestion de proyectos, equipos, usuarios y evidencias
- mobile-app: app para tecnicos, enfocada en operacion y carga de evidencias
- docs: arquitectura, modelo de datos y contexto funcional

## Casos de uso clave

- Gestion de proyectos y equipos
- Registro y consulta de evidencias
- Administracion de usuarios y permisos
- Seguimiento del avance tecnico por equipo

## Ejecucion local

Requisitos minimos:

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Flutter SDK (solo para mobile-app)

### 1) Backend

Pasos:

1. Entrar a la carpeta backend
2. Instalar dependencias
3. Crear backend/.env desde backend/.env.example
4. Configurar variables de base de datos y autenticacion
5. Iniciar servidor

Comandos:

```bash
cd backend
npm install
npm run dev
```

URL por defecto: http://localhost:3000

### 2) Frontend web

Pasos:

1. Entrar a la carpeta frontend
2. Instalar dependencias
3. Iniciar en modo desarrollo

Comandos:

```bash
cd frontend
npm install
npm run dev
```

URL por defecto: http://localhost:3001 (o el puerto disponible)

### 3) Mobile app (opcional)

Pasos:

1. Entrar a la carpeta mobile-app
2. Descargar dependencias
3. Ejecutar en emulador o dispositivo

Comandos:

```bash
cd mobile-app
flutter pub get
flutter run
```

## Pruebas

Backend:

```bash
cd backend
npm test
```

## Despliegue y secretos

El proyecto puede desplegarse desde GitHub sin subir archivos .env.

Practica recomendada:

- Mantener el codigo en el repositorio
- Configurar variables sensibles como Secrets/Environment Variables en el proveedor
- Inyectar secretos en runtime (no en commits)

## Documentacion complementaria

- docs/system-architecture.md
- docs/database-schema.md
- docs/project-context.md
- docs/guia-publicacion-segura-es.md

## Estado

MVP funcional con backend, dashboard web y app movil.

## Licencia

Pendiente de definicion para publicacion (sugerida: MIT).
