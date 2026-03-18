# Arquitectura del sistema

APP MOVIL (Flutter)
      │
      │ REST API
      ▼
BACKEND (Node.js + Express)
      │
      ├── PostgreSQL
      │
      └── Google Drive API
      │
      ▼
DASHBOARD WEB (Next.js)

## Backend

El backend será responsable de:

- autenticación de usuarios
- gestión de proyectos
- gestión de equipos
- gestión de evidencias
- subida de imágenes

## Dashboard web

Permite a los administradores:

- ver proyectos
- ver equipos
- visualizar evidencias

## App móvil

Permite a los técnicos:

- iniciar sesión
- ver proyectos
- crear equipos
- subir evidencias