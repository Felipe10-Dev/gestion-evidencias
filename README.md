# Gestion de Evidencias

Plataforma para registrar, organizar y consultar evidencias tecnicas por proyecto y por equipo.

El sistema esta pensado para operaciones de campo y seguimiento tecnico, con tres frentes de uso:

- API backend para reglas de negocio y datos
- Aplicacion web para administracion y seguimiento
- Aplicacion movil para uso operativo de tecnicos

## Proposito del proyecto

Resolver el control de evidencias en procesos tecnicos donde se necesita:

- Trazabilidad por proyecto, equipo y usuario
- Carga y consulta rapida de evidencias
- Roles y permisos para proteger la informacion
- Flujo centralizado entre web, movil y backend

## Tecnologias

Backend:

- Node.js
- Express
- Sequelize
- PostgreSQL

Frontend web:

- Next.js
- React
- Tailwind CSS

Aplicacion movil:

- Flutter (Android, iOS, Web y Desktop)

## Estructura del repositorio

- backend: API REST, autenticacion, control de acceso, logica de evidencias y servicios
- frontend: interfaz web para gestion de proyectos, equipos y evidencias
- mobile-app: cliente movil para operacion en campo
- docs: documentacion tecnica del sistema

## Casos de uso principales

- Crear y administrar proyectos
- Crear y administrar equipos
- Subir evidencias asociadas a equipos/proyectos
- Consultar evidencias y estado de avance
- Gestionar usuarios con control por roles

## Levantar proyecto en local

Requisitos:

- Node.js 18 o superior
- npm 9 o superior
- PostgreSQL 14 o superior
- Flutter SDK (solo si ejecutarás mobile-app)

### 1. Backend

1. Ir a backend
2. Instalar dependencias
3. Crear archivo backend/.env desde backend/.env.example
4. Configurar variables de base de datos y autenticacion
5. Iniciar servidor

Comandos:

cd backend
npm install
npm run dev

El backend queda disponible por defecto en http://localhost:3000

### 2. Frontend web

1. Ir a frontend
2. Instalar dependencias
3. Iniciar entorno de desarrollo

Comandos:

cd frontend
npm install
npm run dev

La app web queda disponible por defecto en http://localhost:3001 o http://localhost:3000 segun el puerto libre.

### 3. Aplicacion movil (opcional)

1. Ir a mobile-app
2. Instalar dependencias Flutter
3. Ejecutar en emulador o dispositivo

Comandos:

cd mobile-app
flutter pub get
flutter run

## Pruebas

Backend:

cd backend
npm test

## Documentacion tecnica

- docs/system-architecture.md
- docs/database-schema.md
- docs/project-context.md

## Estado del proyecto

MVP funcional con clientes web y movil conectados a una API central.

## Licencia

Pendiente de definicion para publicacion (ejemplo recomendado: MIT).
