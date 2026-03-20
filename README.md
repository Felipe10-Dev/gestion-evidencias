# Gestion de Evidencias

Aplicacion full stack para gestionar proyectos, equipos y evidencias con tres clientes:

- Backend API en Node.js y Express
- Frontend web en Next.js
- App movil en Flutter

## Objetivo

Centralizar la carga y consulta de evidencias por proyecto y equipo, con autenticacion y control de acceso por roles.

## Estructura del repositorio

- backend: API REST, validaciones, autenticacion, acceso a base de datos y servicios de almacenamiento
- frontend: panel web para administracion y operacion
- mobile-app: cliente movil Flutter
- docs: documentacion tecnica del sistema y base de datos

## Tecnologias principales

- Node.js, Express, Sequelize, PostgreSQL
- Next.js, React, Tailwind CSS
- Flutter (Android, iOS, Web, Desktop)

## Requisitos previos

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Flutter SDK (para mobile-app)

## Configuracion rapida local

### 1) Backend

1. Copiar backend/.env.example a backend/.env
2. Completar credenciales locales de base de datos
3. Configurar credenciales de Google Drive por una de estas rutas:
	- OAuth2 por variables de entorno
	- Service Account con archivo local no versionado

Comandos:

```bash
cd backend
npm install
npm run dev
```

### 2) Frontend

Comandos:

```bash
cd frontend
npm install
npm run dev
```

### 3) App movil

Comandos:

```bash
cd mobile-app
flutter pub get
flutter run
```

## Seguridad y publicacion

Antes de hacer publico el repositorio:

- No subir archivos .env
- No subir archivos JSON de credenciales de Google
- No subir tokens, secrets, refresh tokens ni llaves privadas en codigo o docs
- Revisar que backend/.gitignore incluya patrones de credenciales
- Rotar inmediatamente cualquier llave que haya estado expuesta en historial

Guia recomendada: docs/guia-publicacion-segura-es.md

## Despliegue desde repositorio sin subir .env

Si despliegas directo desde GitHub (Railway, Render, Vercel, Azure, etc.), es normal NO subir `.env`.

Flujo recomendado:

1. El codigo vive en GitHub sin secretos
2. Las variables sensibles se configuran en el panel del proveedor (Secrets/Environment Variables)
3. En runtime, el proveedor inyecta esas variables al proceso

En resumen: si, puedes desplegar desde el repo y mantener secretos fuera del repo al mismo tiempo.

## Archivos que parecen basura pero no se deben borrar

En `mobile-app`, archivos como `ios/Runner.xcodeproj/project.pbxproj` son necesarios para compilar iOS.
No son credenciales ni basura: son parte del proyecto nativo generado por Flutter/Xcode.

Solo deberias removerlos si decides dejar de soportar por completo esa plataforma (por ejemplo, eliminar iOS del proyecto).

## Estado de limpieza de repo

Se eliminaron artefactos regenerables y contenido sensible identificado durante auditoria inicial:

- Directorios de build/cache locales
- Dependencias instaladas localmente (node_modules)
- Referencias de secretos reales en documentacion

## Pruebas

Backend:

```bash
cd backend
npm test
```

## Documentacion adicional

- docs/system-architecture.md
- docs/database-schema.md
- docs/project-context.md

## Licencia

Definir licencia antes de abrir el repositorio al publico (por ejemplo, MIT).
