# Base de datos

## Tabla usuarios

id
nombre
email
password
rol
fecha_creacion

Roles posibles:

admin
tecnico

## Tabla proyectos

id
nombre
descripcion
fecha_creacion

## Tabla equipos

id
nombre
proyecto_id
drive_folder_id

Relación:

un proyecto tiene muchos equipos

## Tabla evidencias

id
equipo_id
usuario_id
etapa
drive_url
fecha

Etapas posibles:

antes
durante
despues