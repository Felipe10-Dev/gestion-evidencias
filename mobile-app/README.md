# Mobile App - Gestion de Evidencias

Aplicacion movil Flutter para operacion tecnica en campo: autenticacion, consulta de proyectos/equipos y carga de evidencias.

## Funcionalidad

- Login de usuarios
- Vista operativa de proyectos y equipos
- Carga de evidencias por etapa
- Persistencia local de sesion

## Requisitos

- Flutter SDK 3.x
- Android Studio o dispositivo Android con depuracion USB

## Configuracion

La app consume el backend por medio del servicio API interno.

Antes de pruebas en dispositivo real, validar:

- URL de backend accesible desde el telefono
- Backend operativo y autenticacion funcional

## Desarrollo

```bash
flutter pub get
flutter run
```

## Pruebas

```bash
flutter test
```

## Build APK release

```bash
flutter build apk --release
```

Salida esperada:

- build/app/outputs/flutter-apk/app-release.apk

## Instalacion en dispositivo USB

```bash
flutter devices
flutter install -d <device-id>
```

## Estructura principal

- lib/features: pantallas por dominio (auth, projects, teams, evidences, home)
- lib/data: modelos y servicios de datos
- lib/core: tema, utilidades y widgets reutilizables

## Nota operativa

En Windows, para algunas operaciones con plugins puede requerirse activar Developer Mode.
