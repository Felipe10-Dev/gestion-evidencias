# Base de datos

## Tabla usuarios

id
nombre
email
password
rol
createdAt
updatedAt

Roles posibles:

admin
tecnico

## Tabla proyectos

id
nombre
descripcion
drive_folder_id
createdAt
updatedAt

## Tabla equipos

id
nombre
drive_folder_id
ProjectId
createdAt
updatedAt

Relación:

un proyecto tiene muchos equipos

## Tabla evidencias

id
descripcion
etapa
drive_url
drive_file_id
drive_folder_id
TeamId
UserId
createdAt
updatedAt

Etapas posibles:

antes
durante
despues