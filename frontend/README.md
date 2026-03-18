# Dashboard Web - Gestor Evidencias

Dashboard administrativo para gestionar evidencias técnicas.

## Características

- Autenticación de usuarios.
- Gestión de proyectos.
- Gestión de equipos dentro de cada proyecto.
- Visualización de evidencias.
- Dashboard con métricas rápidas.

## Requisitos

- Node.js 16+
- npm o yarn

## Instalación

```bash
npm install
```

## Configuración

Crea o edita `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Estructura

- `pages/`: define rutas de Next.js y delega la lógica a módulos por dominio.
- `features/`: pantallas y componentes agrupados por dominio (`auth`, `dashboard`, `projects`, `evidences`).
- `components/layout`: shell principal autenticado.
- `components/ui`: piezas reutilizables de interfaz.
- `context/`: estado global compartido.
- `services/api/`: acceso al backend separado por recurso.
- `constants/`: metadatos de navegación y títulos.
- `utils/`: utilidades pequeñas y aisladas.
- `styles/`: estilos globales.

## Rutas

- `/login`: iniciar sesión.
- `/register`: crear usuario.
- `/dashboard`: panel principal.
- `/proyectos`: listado de proyectos.
- `/proyectos/nuevo`: crear proyecto.
- `/proyectos/[projectId]`: detalle del proyecto y sus equipos.
- `/proyectos/equipos/nuevo?projectId=<id>`: crear equipo para un proyecto.
- `/evidencias`: listado de evidencias.

Compatibilidad:
- Si alguien entra por la ruta vieja `/proyectos/:projectId/equipos/nuevo`, Next.js redirige automáticamente a `/proyectos/equipos/nuevo?projectId=:projectId`.

## Convenciones

- Usa imports absolutos con `@/`.
- Mantén `pages/` sin lógica de negocio pesada.
- Coloca formularios, tablas y tarjetas dentro de `features/<dominio>/components`.
- Centraliza llamadas HTTP en `services/api`.

## FAQ de estructura

- ¿Por qué sigue existiendo `[projectId]`?
	Porque es un archivo dinámico (`pages/proyectos/[projectId].js`) que representa la ruta `/proyectos/:projectId`. Ya no está como carpeta anidada.
- ¿Por qué hay varios `index.js`?
	Porque cada carpeta de rutas puede tener su propia página base. Es convención de Next.js y es profesional si se mantiene limpia.
- ¿Qué cambiamos para que se vea más ordenado?
	Se eliminó la carpeta `pages/proyectos/[projectId]/` y se dejó un archivo dinámico plano más claro.
