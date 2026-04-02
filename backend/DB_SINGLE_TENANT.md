# DB Single-Tenant Cleanup (Railway Postgres)

Este proyecto es **single-tenant** (una sola empresa). Si tu Postgres de Railway quedo con tablas/columnas de multi-tenant (`Tenants`, `Plans`, `tenantId`, etc.), usa este flujo.

## Recomendado (produccion): DB limpia nueva

Si los datos actuales son de prueba, lo mas seguro es **crear una DB nueva** (ej: `gestion_evidencias`) y apuntar el backend a esa. Asi no hay riesgo de borrar/alterar cosas en la DB actual.

Crear DB (en el mismo servidor Postgres):

```bash
DB_TARGET_NAME=gestion_evidencias npm run db:create
```

Luego configura en Railway:

- `PGDATABASE=gestion_evidencias` (o ajusta tu `DATABASE_URL` para que termine en `/gestion_evidencias`)
- `DB_SYNC_ALTER=false`
- `DB_RUN_MIGRATIONS=true`

Al arrancar, el backend creara las tablas necesarias via `sequelize.sync({ alter: false })`.

## Antes de tocar la DB

- Haz un backup/snapshot en Railway (pestaña **Backups**).
- Asegura que estas apuntando al Postgres correcto.

## 1) Ver schema actual

```bash
npm run db:inspect
```

## 2) Plan (no ejecuta cambios)

Por defecto corre en modo `soft` y **solo planifica**:

```bash
npm run db:single-tenant:plan
```

## 3) Aplicar modo SOFT (recomendado primero)

SOFT = no borra tablas/columnas; solo quita `NOT NULL` en `tenantId/TenantId` para que no bloqueen inserts.

```bash
# PowerShell (Windows)
$env:DB_CONFIRM_NAME="railway"; $env:CONFIRM_DB_CLEANUP="true"; $env:DB_CLEANUP_MODE="soft"; npm run db:single-tenant:apply
```

## 4) Aplicar modo HARD (destructivo)

HARD = elimina columnas `tenantId/TenantId` de `Users/Projects/Teams/Evidence` y borra tablas `Tenants/Plans/PlanChangeHistories`.

```bash
# PowerShell (Windows)
$env:DB_CONFIRM_NAME="railway"; $env:CONFIRM_DB_CLEANUP="true"; $env:DB_CLEANUP_MODE="hard"; npm run db:single-tenant:apply
```

Si alguna tabla tiene datos, el script no la borrara a menos que fuerces:

```bash
$env:DB_CONFIRM_NAME="railway"; $env:CONFIRM_DB_CLEANUP="true"; $env:DB_CLEANUP_MODE="hard"; $env:DB_CLEANUP_FORCE="true"; npm run db:single-tenant:apply
```

## Variables de conexion

Puedes conectar por `DATABASE_URL`, o por `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`.

Si tu proxy publico no soporta SSL, define:

- `DB_SSL=false`

