#!/usr/bin/env bash
# Despliega una versión del código.
#   ./despliegue/scripts/desplegar.sh pruebas [rama|etiqueta|commit]   construye y levanta el entorno de pruebas
#   ./despliegue/scripts/desplegar.sh produccion                         pasa a producción lo que está en pruebas
#   ./despliegue/scripts/desplegar.sh directo [rama|etiqueta|commit]     construye y publica en producción (primera vez o urgencias)
# Antes de tocar producción se hace un respaldo; si la versión nueva no responde, se vuelve sola a la anterior.
. "$(dirname "$0")/comun.sh"
requiere_env
destino="${1:-}"; ref="${2:-origin/main}"

construir() {
  local etiqueta="$1"
  if [ -d .git ]; then
    info "Trayendo el código ($ref)"
    git fetch --all --tags --prune
    git checkout --force --detach "$ref"
  fi
  local version; version="$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)"
  info "Construyendo la imagen qsi:$etiqueta (versión $version)"
  docker build --pull --build-arg VERSION="$version" -t "qsi:$etiqueta" -t "qsi:$version" .
}

publicar_produccion() {
  info "Respaldo previo"
  "$RAIZ/despliegue/scripts/respaldo.sh" || aviso "No se pudo respaldar (¿primera instalación?)"
  if docker image inspect qsi:produccion >/dev/null 2>&1; then docker tag qsi:produccion qsi:anterior; fi
  docker tag "qsi:$1" qsi:produccion
  preparar_carpetas
  $COMPOSE up -d app caddy
  if esperar_salud app; then
    info "Producción en marcha: https://$DOMINIO"
  else
    aviso "La versión nueva no responde: se vuelve a la anterior"
    if docker image inspect qsi:anterior >/dev/null 2>&1; then
      docker tag qsi:anterior qsi:produccion
      $COMPOSE up -d app
    fi
    $COMPOSE logs --tail=80 app || true
    error "Despliegue revertido. Revise el registro de arriba."
  fi
}

case "$destino" in
  pruebas)
    construir pruebas
    preparar_carpetas
    [ -f datos-pruebas/qsi.sqlite ] || "$RAIZ/despliegue/scripts/refrescar-pruebas.sh" || aviso "Pruebas empieza sin datos"
    $COMPOSE --profile pruebas up -d app-pruebas caddy
    esperar_salud app-pruebas && info "Pruebas en marcha: https://${DOMINIO_PRUEBAS:-pruebas.localhost}" || { $COMPOSE logs --tail=80 app-pruebas; error "Pruebas no responde"; }
    ;;
  produccion)
    docker image inspect qsi:pruebas >/dev/null 2>&1 || error "No hay una versión en pruebas. Primero: desplegar.sh pruebas"
    publicar_produccion pruebas
    ;;
  directo)
    construir nueva
    publicar_produccion nueva
    ;;
  *)
    sed -n '2,6p' "$0"; exit 1 ;;
esac
