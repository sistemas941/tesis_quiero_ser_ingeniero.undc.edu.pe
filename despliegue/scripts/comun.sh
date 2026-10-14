#!/usr/bin/env bash
# Funciones comunes de los scripts de despliegue. No se ejecuta solo.
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"
COMPOSE="docker compose"

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
aviso() { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }
error() { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

requiere_env() {
  [ -f .env ] || error "Falta el archivo .env (copie .env.example y complételo)."
  set -a; . ./.env; set +a
  [ -n "${DOMINIO:-}" ] || error "Defina DOMINIO en .env"
}

# Espera a que el servicio responda en /salud (dentro del contenedor)
esperar_salud() {
  local servicio="$1" i
  for i in $(seq 1 60); do
    if $COMPOSE exec -T "$servicio" node -e "fetch('http://127.0.0.1:3000/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

preparar_carpetas() {
  # El contenedor corre con el mismo usuario que despliega (UID_APP y GID_APP en .env): los archivos son suyos
  mkdir -p datos datos-pruebas respaldos
}
