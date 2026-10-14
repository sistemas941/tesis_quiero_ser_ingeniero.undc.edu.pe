#!/usr/bin/env bash
# Docker debe estar disponible sin sudo interactivo. No usa Caddy.
set -euo pipefail
umask 077
sha="${1:-}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Se requiere un SHA completo'; exit 1; }
release="$(cd "$(dirname "$0")/../.." && pwd)"
export QSI_RAIZ="$HOME/qsi" UID_APP="$(id -u)" GID_APP="$(id -g)"
export QSI_IMAGEN="qsi:$sha"
cd "$release"
[[ -f "$QSI_RAIZ/.env" && -f "$QSI_RAIZ/datos/qsi.sqlite" ]] || {
  echo 'Falta .env o la base instalada en ~/qsi/datos'; exit 1;
}
exec 9>"$QSI_RAIZ/.despliegue.lock"
flock -n 9 || { echo 'Ya hay otro despliegue en curso'; exit 1; }
compose=(docker compose --env-file "$QSI_RAIZ/.env" -f "$release/despliegue/compose.apache.yml")
"${compose[@]}" config --quiet
docker build --build-arg "VERSION=$sha" -t "$QSI_IMAGEN" .
mkdir -p "$QSI_RAIZ/respaldos"
anterior="$(docker ps -aq --filter label=com.docker.compose.project=qsi-apache --filter label=com.docker.compose.service=app)"
imagen_anterior=''
if [[ -n "$anterior" ]]; then imagen_anterior="$(docker inspect -f '{{.Image}}' "$anterior")"; fi
legacy=''
if [[ "$(docker inspect -f '{{.State.Running}}' qsi-prueba 2>/dev/null || true)" == true ]]; then
  montaje="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/datos"}}{{.Source}}{{end}}{{end}}' qsi-prueba)"
  [[ "$(realpath "$montaje")" == "$(realpath "$QSI_RAIZ/datos")" ]] || {
    echo 'El contenedor actual usa otra carpeta de datos'; exit 1;
  }
  legacy=qsi-prueba
fi
cambio=0
recuperar() {
  resultado=$?
  trap - EXIT
  if [[ "$resultado" != 0 && "$cambio" == 1 ]]; then
    echo 'Despliegue fallido: recuperando versión anterior sin restaurar datos.'
    "${compose[@]}" logs --tail 60 app || true
    if [[ -n "$imagen_anterior" ]]; then
      export QSI_IMAGEN="$imagen_anterior"
      "${compose[@]}" up -d --no-deps --force-recreate app || true
    elif [[ -n "$legacy" ]]; then
      "${compose[@]}" stop app || true
      docker start "$legacy" || true
    fi
  fi
  exit "$resultado"
}
trap recuperar EXIT
cambio=1
[[ -z "$anterior" ]] || docker stop "$anterior" >/dev/null
[[ -z "$legacy" ]] || docker stop "$legacy" >/dev/null
# Copia en frío de toda la carpeta, incluyendo WAL si existe.
respaldo="$QSI_RAIZ/respaldos/qsi_$(date +%Y%m%d_%H%M%S)_${sha:0:8}.tar.gz"
tar -czf "$respaldo" -C "$QSI_RAIZ" datos
"${compose[@]}" up -d --no-deps --force-recreate app
salud=0
for i in $(seq 1 60); do
  if "${compose[@]}" exec -T app node -e \
    'fetch("http://127.0.0.1:3000/salud").then(async r=>{const d=await r.json();process.exit(r.ok&&d.ok&&d.compilacion===process.argv[1]?0:1)}).catch(()=>process.exit(1))' "$sha"; then
    salud=1; break
  fi
  sleep 2
done
[[ "$salud" == 1 ]] || { echo 'No respondió la nueva versión'; exit 1; }
curl --fail --silent --show-error --max-time 30 \
  https://test.tesisherrera.undc.edu.pe/salud | \
  "${compose[@]}" exec -T app node -e \
  'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const d=JSON.parse(s);process.exit(d.ok&&d.compilacion===process.argv[1]?0:1)})' "$sha"
printf '%s\n' "$sha" > "$QSI_RAIZ/.version-desplegada"
cambio=0
echo "Despliegue correcto: $sha. Respaldo: $respaldo"
