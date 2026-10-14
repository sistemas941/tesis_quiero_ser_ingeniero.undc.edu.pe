# Migración de la versión 1 (Google) a la versión 2 (servidor propio)

La migración se hace **cuando la fase del plan de tesis esté cerrada y los planes aprobados**. Hasta ese día los estudiantes siguen trabajando en la versión 1 sin cambios. Las contraseñas siguen sirviendo en la versión 2: nadie tiene que registrarse de nuevo.

## Dos caminos que se complementan

| | Migración completa | Expediente individual |
|---|---|---|
| Quién | El administrador (José) y Ricardo | Cada estudiante |
| Qué viaja | Todas las pestañas (usuarios, expedientes, avance, biblioteca, borradores, comentarios, bitácora de IA, configuración) y las figuras | Su plan, biblioteca, borrador y figuras; con firma válida, también la aprobación del plan, el avance, los comentarios y la bitácora |
| Cómo | `exportarTodo()` en Apps Script → `.zip` → `importar-v1.sh` en el servidor | «Mi configuración → Mi expediente»: descargar en la 1, importar en la 2 |
| Cuándo | El día del traslado | Después, para casos puntuales (quien siguió trabajando en la 1, una cuenta nueva, un respaldo propio) |

### La firma del expediente

La versión 1 firma cada expediente con un secreto (`MIGRACION_SECRETO`, se crea solo la primera vez). La migración completa lleva ese secreto al servidor, así que la versión 2 reconoce las firmas de la 1.

- **Firma válida:** se importa todo, incluida la aprobación del plan (y su Word se vuelve a generar en el servidor).
- **Sin firma o archivo modificado:** solo el contenido (campos, biblioteca, borrador). Las aprobaciones tendrán que darse de nuevo. Un plan ya aprobado en la versión 2 no se puede reemplazar con un archivo sin firma.
- Cada estudiante solo importa su propio expediente; antes de reemplazar, se guarda un respaldo de lo que había.

## Antes del traslado (puede hacerse ya)

1. **Actualizar la versión 1 a la 1.7** (carpeta `version1_apps_script/`): agrega el botón «Descargar mi expediente», `exportarTodo()` y el modo de solo lectura. Se pega igual que siempre (Codigo.gs, Script.html, Estilos.html) y se publica una versión nueva. No cambia nada para los estudiantes salvo el botón nuevo.
2. **Levantar la versión 2** en el servidor con una instalación de prueba (guía de despliegue) y revisarla en `pruebas.<dominio>`.
3. **Ensayo general:** ejecutar `exportarTodo()` una vez, cargar el `.zip` en **pruebas** con `./despliegue/scripts/importar-v1.sh QSI_migracion_*.zip --pruebas --forzar` y recorrer la lista de verificación de abajo en `pruebas.<dominio>`. Luego borrar ese `.zip` del servidor y de Drive.
4. Anunciar a estudiantes y asesores la fecha del traslado y la nueva dirección.

## El día del traslado

| Paso | Quién | Acción |
|---|---|---|
| 1 | José | En la hoja de datos de la versión 1, pestaña **Config**: `SOLO_LECTURA = SI` y `NUEVA_DIRECCION = https://<dominio>`. Desde ese momento la 1 solo permite consultar y descargar el expediente, y muestra la nueva dirección al ingresar. |
| 2 | José | En el editor de Apps Script, elegir la función `exportarTodo` y pulsar **Ejecutar**. El registro muestra el enlace al `.zip` en Drive. |
| 3 | José | Descargar el `.zip` y entregarlo a Ricardo por un medio privado (no por correo abierto). |
| 4 | Ricardo | Subirlo al servidor (`scp QSI_migracion_*.zip usuario@servidor:/opt/qsi/`) y ejecutar `./despliegue/scripts/importar-v1.sh QSI_migracion_*.zip`. Si la producción ya tenía datos de prueba, agregar `--forzar` (antes se respalda solo). |
| 5 | Ambos | Lista de verificación (abajo). |
| 6 | José | En Google Sites, cambiar la URL insertada por `https://<dominio>`. |
| 7 | Ricardo | Borrar el `.zip` del servidor (`rm /opt/qsi/QSI_migracion_*.zip`) y José, de Drive. |

### Lista de verificación

- [ ] `./despliegue/scripts/herramientas.sh estado` muestra cantidades parecidas a las pestañas de la hoja de Google (Usuarios, Expedientes, Biblioteca, Informe).
- [ ] El administrador ingresa con su clave de siempre.
- [ ] Un estudiante con plan aprobado ingresa con su clave, ve su plan como aprobado y descarga el Word del plan aprobado.
- [ ] Un estudiante sin aprobar ve su avance y puede seguir editando.
- [ ] Un asesor ve a sus estudiantes; el coordinador ve el tablero.
- [ ] «Ver mi tesis» → Descargar en Word y PDF funcionan.
- [ ] El borrador muestra sus secciones y figuras.
- [ ] En la versión 1 aparece el aviso de traslado y no se puede guardar.

## Si algo sale mal

- **Antes de cambiar Google Sites:** la versión 1 sigue intacta. Basta con volver `SOLO_LECTURA = NO` y reintentar otro día.
- **Después:** `./despliegue/scripts/restaurar.sh` devuelve el servidor al último respaldo; `revertir.sh` vuelve el código a la versión anterior.
- Lo hecho en la versión 2 se puede llevar a cualquier instalación nueva con el expediente individual (también va firmado).

## Notas

- Las sesiones abiertas no viajan: todos vuelven a ingresar una vez.
- Los Word y PDF antiguos de Google Docs siguen en el Drive de la cuenta de la versión 1. En la versión 2 se generan de nuevo con un clic; los de los planes aprobados se regeneran durante la importación.
- También se puede importar el `.xlsx` descargado de la hoja de Google (Archivo → Descargar → Excel), pero así no viajan las figuras ni el secreto de firma. Es el plan B si `exportarTodo()` superara el límite de 50 MB de Apps Script.
- `exportarTodo()` deja en Drive datos personales y huellas de contraseñas: se borra en cuanto se importa.
