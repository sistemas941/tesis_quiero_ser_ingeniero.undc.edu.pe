#!/usr/bin/env bash
# Prepara un servidor Ubuntu (22.04 o 24.04) recién creado y levanta la aplicación.
# Se ejecuta UNA vez, desde la carpeta del repositorio clonado (recomendado: /opt/qsi):
#
#   sudo apt-get update && sudo apt-get install -y git
#   sudo mkdir -p /opt/qsi && sudo chown "$USER" /opt/qsi
#   git clone https://github.com/<cuenta>/quiero-ser-ingeniero.git /opt/qsi
#   cd /opt/qsi && ./despliegue/scripts/instalar-servidor.sh
#
# Hace: Docker y Compose, cortafuegos (22, 80, 443), memoria de intercambio si hay poca RAM,
# el archivo .env (pregunta lo mínimo), la clave del entorno de pruebas, el respaldo diario (cron),
# la primera construcción y la instalación de la aplicación (muestra la clave inicial del administrador).
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"
info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
aviso() { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }
SUDO=""; [ "$(id -u)" -eq 0 ] || SUDO="sudo"
USUARIO="$(id -un)"

# --- 1. Docker
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  info "Instalando Docker y Compose"
  $SUDO apt-get update
  if ! $SUDO apt-get install -y docker.io docker-compose-v2; then
    aviso "Paquetes de Ubuntu no disponibles: se usa el instalador oficial de Docker"
    curl -fsSL https://get.docker.com | $SUDO sh
  fi
  $SUDO systemctl enable --now docker
fi
if ! id -nG "$USUARIO" | grep -qw docker; then
  $SUDO usermod -aG docker "$USUARIO"
  aviso "Se agregó $USUARIO al grupo docker. Cierre la sesión SSH, vuelva a entrar y ejecute de nuevo este script."
  exit 0
fi

# --- 2. Cortafuegos
if command -v ufw >/dev/null 2>&1; then
  info "Cortafuegos: SSH, HTTP y HTTPS"
  $SUDO ufw allow OpenSSH >/dev/null || $SUDO ufw allow 22/tcp >/dev/null
  $SUDO ufw allow 80/tcp >/dev/null; $SUDO ufw allow 443/tcp >/dev/null; $SUDO ufw allow 443/udp >/dev/null
  $SUDO ufw --force enable >/dev/null
fi
aviso "Abra también los puertos 80 y 443 en el grupo de seguridad de la consola de Huawei Cloud."

# --- 3. Memoria de intercambio (LibreOffice y Node juntos necesitan margen)
ram_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$ram_mb" -lt 3500 ] && ! swapon --show | grep -q .; then
  info "RAM de ${ram_mb} MB: se crea un archivo de intercambio de 2 GB"
  $SUDO fallocate -l 2G /swapfile && $SUDO chmod 600 /swapfile && $SUDO mkswap /swapfile >/dev/null && $SUDO swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
fi

# --- 4. Archivo .env
if [ ! -f .env ]; then
  info "Configuración (.env)"
  cp .env.example .env
  read -r -p "Dominio de la aplicación (ej. tesis.midominio.pe): " dom
  read -r -p "Correo para avisos de certificados HTTPS: " ctls
  read -r -p "Correo del administrador de la aplicación: " adm
  read -r -p "Dominio de pruebas (Enter para pruebas.$dom): " domp
  domp="${domp:-pruebas.$dom}"
  sed -i "s|^DOMINIO=.*|DOMINIO=$dom|; s|^CORREO_TLS=.*|CORREO_TLS=$ctls|; s|^ADMIN_CORREO=.*|ADMIN_CORREO=$adm|; s|^DOMINIO_PRUEBAS=.*|DOMINIO_PRUEBAS=$domp|" .env
fi
sed -i "s|^UID_APP=.*|UID_APP=$(id -u)|; s|^GID_APP=.*|GID_APP=$(id -g)|" .env
chmod 600 .env
if ! grep -q '^PRUEBAS_HASH=.\+' .env; then
  clave_pruebas="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 20)"
  hash="$(docker run --rm caddy:2.8 caddy hash-password --plaintext "$clave_pruebas")"
  sed -i "s|^PRUEBAS_HASH=.*|PRUEBAS_HASH=$hash|" .env
  info "Entorno de pruebas protegido. Usuario: pruebas   Clave: $clave_pruebas   (anótela; no se vuelve a mostrar)"
fi

# --- 5. Respaldo diario a las 02:30 y limpieza de imágenes viejas los domingos
tarea_respaldo="30 2 * * * cd $RAIZ && ./despliegue/scripts/respaldo.sh >> $RAIZ/respaldos/respaldo.log 2>&1"
tarea_limpieza="15 4 * * 0 docker image prune -f --filter until=720h >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'despliegue/scripts/respaldo.sh' | grep -v 'docker image prune' ; echo "$tarea_respaldo"; echo "$tarea_limpieza" ) | crontab -
mkdir -p respaldos

# --- 6. Primera construcción y arranque
info "Construyendo y levantando la aplicación (la primera vez tarda unos minutos)"
./despliegue/scripts/desplegar.sh directo HEAD
if ! docker compose exec -T app node -e "const {abrir}=require('./servidor/runtime/bd');const b=abrir('/datos');process.exit(b.q(\"SELECT v FROM props WHERE k='HOJA_ID'\").get()?0:1)"; then
  echo
  read -r -p "¿Tiene ya el .zip de la versión 1 (exportarTodo) para migrar? (si/no) " tiene
  if [ "$tiene" = "si" ]; then
    read -r -p "Ruta del archivo .zip: " zip
    ./despliegue/scripts/importar-v1.sh "$zip"
  else
    info "Instalación nueva (sin datos de la versión 1)"
    docker compose exec -T app node servidor/herramientas.js instalar
  fi
fi
set -a; . ./.env; set +a
info "Listo. Abra https://$DOMINIO  (si el DNS aún no apunta a este servidor, el certificado se obtendrá cuando lo haga)."
