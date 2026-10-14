# CI/CD del servidor de pruebas con Apache

Repositorio: https://github.com/sistemas941/tesis_quiero_ser_ingeniero.undc.edu.pe

Destino: `user_pru3bas@119.8.150.18:2223`, aplicación en `~/qsi`, dominio
`https://test.tesisherrera.undc.edu.pe`. Apache y Certbot permanecen fuera de Docker.

## Comportamiento

Las PR ejecutan CI sin credenciales de despliegue. Los cambios en `main` ejecutan CI
y solo despliegan si la variable de repositorio `DEPLOY_ENABLED` vale `true`.
También se puede ejecutar Actions → Desplegar en Apache → Run workflow sobre main.
Se transfiere un archivo del commit probado; el servidor no necesita acceso Git a GitHub.

Cada publicación construye antes de detener la aplicación, hace un respaldo en frío
de `~/qsi/datos`, reemplaza el contenedor y verifica el SHA en `/salud`, tanto dentro
del contenedor como por HTTPS. Hay una interrupción durante el respaldo y arranque.
Si falla intenta recuperar la imagen anterior, sin restaurar la base de datos.
La primera publicación reemplaza `qsi-prueba` por el servicio Compose `qsi-apache`.
No inicia Caddy, modifica Apache ni ejecuta instalar. `.env` y `datos` se conservan.
Las modificaciones de esquema futuras deben ser compatibles con la versión anterior.

## Preparación del servidor (una vez)

Verificar que `.env` y `datos/qsi.sqlite` existan en `/home/user_pru3bas/qsi`.
El usuario SSH debe tener acceso Docker sin contraseña interactiva. Si el administrador
autoriza usar este usuario para despliegues:

```bash
sudo usermod -aG docker user_pru3bas
```

Cerrar SSH, reconectar y verificar `docker ps` y `docker compose version` sin sudo.
El grupo Docker concede control equivalente a root: proteger la clave de despliegue
y limitar quién puede modificar main y los workflows. No agregar un runner propio
al servidor compartido para ejecutar PR públicas.

En la computadora local, generar una clave exclusiva (sin passphrase para Actions):

```powershell
ssh-keygen -t ed25519 -f "$HOME/.ssh/qsi_actions" -C "github-actions-qsi"
```

Elegir passphrase vacía cuando lo solicite. Copiar únicamente el archivo `.pub`:

```powershell
scp -P 2223 "$HOME/.ssh/qsi_actions.pub" user_pru3bas@119.8.150.18:qsi_actions.pub
```

En el servidor:

```bash
install -d -m 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/qsi_actions.pub >> ~/.ssh/authorized_keys
rm ~/qsi_actions.pub
```

Probar desde la computadora:

```powershell
ssh -i "$HOME/.ssh/qsi_actions" -p 2223 user_pru3bas@119.8.150.18 "docker ps"
```

Obtener la clave pública del host desde el servidor autenticado:

```bash
sudo cat /etc/ssh/ssh_host_ed25519_key.pub
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Construir SSH_HOSTS usando la clave pública, sin el comentario final:
`[119.8.150.18]:2223 ssh-ed25519 AAAA...`.
No usar una captura de ssh-keyscan sin verificar la huella con el administrador.

## GitHub

Crear Settings → Environments → `pruebas`, restringido a main. Proteger main
con revisiones y checks de CI según las opciones disponibles en la cuenta.

En Secrets and variables → Actions, crear secretos de repositorio:

| Nombre | Valor |
| --- | --- |
| SSH_HOST | 119.8.150.18 |
| SSH_PUERTO | 2223 |
| SSH_USUARIO | user_pru3bas |
| SSH_CLAVE | Contenido completo de qsi_actions, clave privada dedicada |
| SSH_HOSTS | Entrada verificada indicada arriba |

Nunca publicar la clave privada en Git, logs o mensajes. Gemini permanece únicamente
en `.env` del servidor. Para habilitar las publicaciones, crear variable de
**repositorio** `DEPLOY_ENABLED=true` después de completar los requisitos.
Si los runners de GitHub no alcanzan SSH, coordinar el acceso de red con el administrador.

## Operación

Estado: `docker ps` y `curl -fsS https://test.tesisherrera.undc.edu.pe/salud`.
Logs: `docker logs --tail 100 qsi-apache-app-1`.
SHA actual: `cat ~/qsi/.version-desplegada`.
No iniciar `qsi-prueba` simultáneamente: usa el mismo puerto y los mismos datos.

Para republicar una release anterior existente (sin restaurar datos):
`bash ~/qsi/releases/SHA/despliegue/scripts/desplegar-apache.sh SHA`.
Esto vuelve a construir la imagen; los cambios de esquema deben ser compatibles.
Los respaldos, releases e imágenes se conservan: establecer retención y copia externa
con el administrador. No borrar datos para liberar espacio.

No usar los scripts antiguos `desplegar.sh` para esta instalación: están orientados a Caddy.
