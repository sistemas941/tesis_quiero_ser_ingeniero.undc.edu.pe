# ¡Quiero ser Ingeniero! — versión 2

Asistente para el proyecto y el borrador de tesis de la Escuela Profesional de Ingeniería de Sistemas de la Universidad Nacional de Cañete. Autor: Dr. José Alfredo Herrera Quispe.

La **versión 1** funciona en Google Apps Script. La **versión 2** es la misma aplicación en un servidor propio: mismo código, mismas pantallas, mismas contraseñas; los datos pasan de Google Hojas de cálculo y Drive a SQLite y disco, y los documentos se generan como Word reales (con PDF vía LibreOffice).

## Por dónde empezar

| Si usted es… | Lea |
|---|---|
| Responsable del servidor | [`docs/GUIA_DESPLIEGUE.md`](docs/GUIA_DESPLIEGUE.md) |
| Quien coordina el traslado desde la versión 1 | [`docs/MIGRACION.md`](docs/MIGRACION.md) |
| Quien pedirá mejoras | [`docs/MEJORAS_CON_IA.md`](docs/MEJORAS_CON_IA.md) |
| Un asistente de programación | [`CLAUDE.md`](CLAUDE.md) |

## Estructura

```
src/                   código de la aplicación (Apps Script) y cliente (src/cliente)
tools/build.py         construye dist/ (lo que se publica en Apps Script y lo que ejecuta el servidor)
servidor/              versión 2: servidor HTTP, capa compatible con Google y herramientas
  runtime/             SpreadsheetApp→SQLite, DriveApp→disco, DocumentApp→.docx, etc.
  principal.js         servidor (puerto 3000)
  herramientas.js      instalar, importar-v1, config, reiniciar-clave, respaldos…
  test/                pruebas de la versión 2 (de punta a punta y en navegador)
test/                  pruebas de la lógica (simulador de Apps Script) y de la interfaz
despliegue/            Caddyfile y scripts del servidor
docs/                  guías
version1_apps_script/  versión 1.7 lista para pegar en Apps Script (agrega la exportación)
Dockerfile, docker-compose.yml, .env.example
```

## Probar en una computadora

Requiere Node.js 22.13 o superior y Python 3. LibreOffice es opcional (solo para el PDF).

```bash
python3 tools/build.py
DATOS=./datos ADMIN_CORREO=admin@ejemplo.pe node servidor/herramientas.js instalar   # muestra la clave inicial
DATOS=./datos node servidor/principal.js                                            # http://localhost:3000
```

Pruebas: `npm run prueba` (lógica y versión 2) y `npm run prueba:ui` (navegador; requiere `npm install` y `npx playwright install chromium`).
