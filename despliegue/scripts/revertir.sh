#!/usr/bin/env bash
# Vuelve producción a la versión anterior del código (los datos no cambian).
#   ./despliegue/scripts/revertir.sh            a la versión previa al último despliegue
#   ./despliegue/scripts/revertir.sh <version>  a una versión concreta (docker images qsi)
. "$(dirname "$0")/comun.sh"
requiere_env
objetivo="${1:-anterior}"
docker image inspect "qsi:$objetivo" >/dev/null 2>&1 || error "No existe la imagen qsi:$objetivo. Vea las disponibles con: docker images qsi"
docker tag "qsi:$objetivo" qsi:produccion
$COMPOSE up -d app
esperar_salud app && info "Producción volvió a qsi:$objetivo" || error "La versión qsi:$objetivo tampoco responde"
