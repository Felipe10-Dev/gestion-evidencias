# Guia de Publicacion Segura (ES)

Esta guia resume lo minimo necesario para publicar este repositorio de forma segura.

## 1) Confirmar que no hay secretos versionados

Revisar en Git:

```bash
git status
git grep -n -I -E "BEGIN PRIVATE KEY|private_key|refresh_token|client_secret|api[_-]?key"
```

Si aparece informacion sensible, eliminarla del codigo y de la documentacion.

## 2) Verificar archivos que nunca deben subirse

- backend/.env
- frontend/.env.local
- Cualquier archivo JSON de service account
- Llaves privadas .pem o .key

Regla: si sirve para autenticarse, no debe estar en el repo.

## 3) Rotar credenciales comprometidas

Si una clave estuvo en un commit anterior, se considera comprometida aunque ya no exista en la ultima version.

Acciones:

- Regenerar credenciales de Google/OAuth
- Invalidar refresh tokens anteriores
- Actualizar variables de entorno en entorno local y de despliegue

## 4) Limpiar historial de Git (si hubo filtracion)

Si necesitas publicar sin rastro historico:

1. Reescribir historial para remover archivos sensibles
2. Forzar push al repositorio remoto
3. Pedir a colaboradores volver a clonar

Nota: este paso es obligatorio si un secreto estuvo en commits antiguos.

## 5) Checklist previo a hacer publico

- README principal actualizado
- No hay secretos en codigo, docs ni ejemplos
- Variables sensibles solo en entorno
- .gitignore actualizado
- Pruebas basicas pasan

## 5.1) Si despliegas directo desde GitHub

Esto NO cambia las reglas de seguridad:

- El repo sigue sin `.env` ni llaves
- Configuras secretos en Railway/Render/Vercel/Azure/GitHub Actions
- El entorno de despliegue inyecta variables en runtime

Desplegar desde repo y proteger secretos son compatibles.

## 5.2) Archivos grandes o ruidosos que SI son necesarios

No eliminar por error archivos de configuracion nativa como:

- `mobile-app/ios/Runner.xcodeproj/project.pbxproj`
- `mobile-app/android/**/*.gradle*`

No son credenciales. Son metadatos de build para iOS/Android.

## 6) Variables de entorno recomendadas

Backend (ejemplo):

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<valor-seguro>
TRUST_PROXY=true
DB_RUN_MIGRATIONS=true
DB_SYNC_ALTER=false
DB_SSL=<true|false>
DB_HOST=<host>
DB_PORT=5432
DB_NAME=<db>
DB_USER=<user>
DB_PASSWORD=<password>
GOOGLE_DRIVE_CREDENTIALS_PATH=<ruta-local-no-versionada>
GOOGLE_DRIVE_FOLDER_ID=<id-carpeta>
GOOGLE_OAUTH_CLIENT_ID=<client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<client-secret>
GOOGLE_OAUTH_REFRESH_TOKEN=<refresh-token>
```

## 7) Buenas practicas continuas

- Usar secretos desde variables de entorno o vault
- Evitar pegar tokens en issues, PRs o markdown
- Agregar escaneo de secretos en CI
- Revisar cambios antes de cada push
