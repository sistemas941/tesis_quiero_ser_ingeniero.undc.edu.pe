# Guía de despliegue — versión 2 en servidor propio

**Para:** Ricardo Inquilla (responsable del servidor) · **De:** José Herrera · **Aplicación:** ¡Quiero ser Ingeniero! 2.0

Esta guía lleva la aplicación desde un servidor vacío hasta producción con HTTPS, respaldos diarios, un entorno de pruebas y despliegues automáticos desde GitHub. Tiempo estimado: una hora, más la propagación del DNS.

## 1. Qué se instala

```
Internet ──443──► Caddy (HTTPS automático) ──► app          (producción, ./datos)
                                         └──► app-pruebas  (pruebas, ./datos-pruebas, con usuario y clave)
```

- **app**: Node.js 22 sin dependencias externas. Datos en SQLite (`datos/qsi.sqlite`) y archivos (`datos/archivos/`). LibreOffice dentro de la imagen convierte los Word a PDF.
- **caddy**: obtiene y renueva solo los certificados de Let's Encrypt.
- Todo corre en Docker con `docker compose`. No hay base de datos aparte que administrar.

## 2. Requisitos

| Recurso | Mínimo | Recomendado (≈150 estudiantes) |
|---|---|---|
| vCPU | 2 | 2–4 |
| RAM | 2 GB (el script crea 2 GB de intercambio) | 4 GB |
| Disco | 20 GB | 40 GB SSD |
| Sistema | Ubuntu 22.04 o 24.04 LTS | Ubuntu 24.04 LTS |

- Sirve en x86_64 y en ARM (instancias Kunpeng de Huawei Cloud): la imagen es multiarquitectura.
- **Grupo de seguridad de Huawei Cloud:** abrir 22/tcp (de preferencia solo desde IP conocidas), 80/tcp, 443/tcp y 443/udp.
- **DNS:** dos registros tipo A hacia la IP pública del servidor, por ejemplo `tesis.midominio.pe` y `pruebas.tesis.midominio.pe`. Si aún no hay dominio, puede usarse provisionalmente `<ip-con-guiones>.sslip.io` (por ejemplo `190-12-34-56.sslip.io`), que resuelve solo a esa IP y admite certificado.

## 3. Repositorio en GitHub

1. Crear un repositorio **privado** (por ejemplo `quiero-ser-ingeniero`) y subir el contenido de este paquete:
   ```bash
   cd QuieroSerIngeniero_v2
   git init -b main && git add . && git commit -m "Versión 2.0"
   git remote add origin git@github.com:<cuenta>/quiero-ser-ingeniero.git
   git push -u origin main
   ```
2. Agregar a José y a Ricardo como colaboradores.
3. En **Settings → Environments**, crear `pruebas` y `produccion`. En `produccion`, activar *Required reviewers* (José y Ricardo): así nada llega a producción sin aprobación. En repositorios privados esta opción requiere un plan de pago de GitHub; con el plan gratuito, el control es que producción solo se publica a mano desde *Run workflow*.
4. Los secretos se cargan en el paso 6, cuando el servidor ya existe.

## 4. Preparar el servidor (una sola vez)

Conectarse por SSH con un usuario con `sudo` (no root):

```bash
sudo apt-get update && sudo apt-get install -y git
sudo mkdir -p /opt/qsi && sudo chown "$USER" /opt/qsi
git clone https://github.com/<cuenta>/quiero-ser-ingeniero.git /opt/qsi
cd /opt/qsi
./despliegue/scripts/instalar-servidor.sh
```

El script instala Docker, configura el cortafuegos, crea el intercambio si hay poca RAM, pregunta el dominio y los correos y genera `.env`, crea la clave del entorno de pruebas (la muestra **una sola vez**), programa el respaldo diario a las 02:30, construye la imagen y levanta la aplicación. La primera vez pide cerrar sesión para entrar al grupo `docker`: se vuelve a entrar y se ejecuta de nuevo.

Al final pregunta si ya existe el `.zip` de la versión 1:

- **No** (instalación de prueba): instala vacía y muestra la clave inicial del administrador (`ADMIN_CORREO`).
- **Sí**: carga la migración completa (ver `docs/MIGRACION.md`).

Para clonar un repositorio privado en el servidor se usa una *deploy key* de solo lectura: `ssh-keygen -t ed25519 -f ~/.ssh/github_qsi`, pegar `~/.ssh/github_qsi.pub` en GitHub (Settings → Deploy keys) y clonar con `git@github.com:...` configurando `~/.ssh/config`.

## 5. El archivo `.env`

Vive solo en el servidor (`/opt/qsi/.env`, permisos 600). Campos principales:

| Variable | Para qué |
|---|---|
| `DOMINIO`, `DOMINIO_PRUEBAS`, `CORREO_TLS` | Dominios y correo de avisos de Let's Encrypt |
| `ADMIN_CORREO` | Administrador de la aplicación (el «propietario» de Apps Script) |
| `UID_APP`, `GID_APP` | Usuario con que corre el contenedor (los rellena el script) |
| `TRABAJADORES` | Llamadas simultáneas. 4 es adecuado para 2 vCPU |
| `GEMINI_API_KEY`, `CONSENSUS_API_KEY`, `OPENALEX_API_KEY` | Claves del curso (opcionales). Las de los estudiantes nunca se guardan |
| `MIGRACION_SECRETO` | Firma de expedientes. Si se importa el `.zip` de la versión 1, viaja dentro |
| `DESTINO_REMOTO` | (Opcional) `usuario@host:/ruta` para copiar cada respaldo fuera del servidor |

Después de cambiar `.env`: `docker compose up -d app`.

## 6. Despliegues automáticos desde GitHub

En el servidor, crear una clave solo para despliegues y autorizarla:

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/despliegue_qsi
cat ~/.ssh/despliegue_qsi.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/despliegue_qsi          # contenido para el secreto SSH_CLAVE
ssh-keyscan -p 22 <ip-del-servidor> # contenido para el secreto SSH_HOSTS
```

En GitHub, **Settings → Secrets and variables → Actions**: `SSH_HOST`, `SSH_USUARIO`, `SSH_CLAVE`, `SSH_HOSTS` y, si no es 22, `SSH_PUERTO`.

Desde entonces:

- Todo cambio que llega a `main` y pasa las pruebas se publica solo en **pruebas** (`https://pruebas.<dominio>`, con usuario y clave).
- **Producción** se publica desde *Actions → Desplegar → Run workflow → destino: produccion*, con aprobación. Antes se respalda; si la versión nueva no responde en dos minutos, vuelve sola a la anterior.

## 7. Operación diaria

Todo se ejecuta en `/opt/qsi`:

| Tarea | Orden |
|---|---|
| Estado de los servicios | `docker compose ps` |
| Registro en vivo | `docker compose logs -f app` |
| Salud | `curl -s https://<dominio>/salud` |
| Reiniciar | `docker compose restart app` |
| Respaldo ahora | `./despliegue/scripts/respaldo.sh` |
| Restaurar | `./despliegue/scripts/restaurar.sh respaldos/qsi_AAAAMMDD_HHMM.tar.gz` |
| Volver a la versión anterior | `./despliegue/scripts/revertir.sh` |
| Publicar a mano | `./despliegue/scripts/desplegar.sh pruebas origin/main` y luego `... produccion` |
| Copiar producción a pruebas | `./despliegue/scripts/refrescar-pruebas.sh` |
| Resumen de datos | `./despliegue/scripts/herramientas.sh estado` |
| Ver o cambiar la configuración | `./despliegue/scripts/herramientas.sh config [CLAVE [VALOR]]` |
| Clave olvidada (cualquier rol) | `./despliegue/scripts/herramientas.sh reiniciar-clave correo@undc.edu.pe` |
| Excel con todos los datos | `./despliegue/scripts/herramientas.sh exportar-datos /datos/datos.xlsx` |

El administrador también descarga los datos en Excel desde la aplicación (Administración → Descargar los datos), sin las huellas de las contraseñas.

**Monitoreo recomendado:** un servicio gratuito (UptimeRobot, Better Stack) que consulte `https://<dominio>/salud` cada 5 minutos y avise por correo.

**Respaldos:** quedan en `/opt/qsi/respaldos` (los últimos 14). Conviene copiarlos fuera del servidor con `DESTINO_REMOTO` o con una copia semanal manual. Una prueba de restauración en el entorno de pruebas cada mes confirma que sirven.

## 8. Insertar en Google Sites

En Sites, editar la página → Insertar → Por URL → `https://<dominio>` → «Página completa». La aplicación permite insertarse en Google Sites por defecto (`PERMITIR_INSERTAR = SI` en Config). Para otro sitio, ajustar `MARCOS_PERMITIDOS` en `.env`.

## 9. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El navegador avisa de certificado inválido | El DNS aún no apunta o el puerto 80 está cerrado | Revisar el registro A y el grupo de seguridad; `docker compose logs caddy` |
| «Error interno del servidor» | Excepción en una llamada | `docker compose logs --tail=200 app` |
| El PDF no sale, el Word sí | LibreOffice tardó o falló | Reintentar; el Word es el documento de referencia |
| «El servidor está ocupado» | Muchas consultas largas a la vez | Subir `TRABAJADORES` (y la RAM) |
| La IA del curso no responde | Falta `GEMINI_API_KEY` o se agotó la cuota | Revisar `.env`; los estudiantes pueden usar su propia clave |
| Disco lleno | Respaldos o imágenes viejas | `docker image prune`; mover respaldos fuera |

## 10. Seguridad

- SSH solo con clave; desactivar el acceso con contraseña (`PasswordAuthentication no` en `/etc/ssh/sshd_config`).
- Actualizaciones automáticas de Ubuntu: `sudo apt-get install -y unattended-upgrades`.
- `.env`, `datos/` y `respaldos/` contienen datos personales y huellas de contraseñas: no se copian a computadoras personales ni a GitHub.
- Ninguna clave de IA de un estudiante llega a guardarse en el servidor.
