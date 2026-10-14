#!/usr/bin/env bash
# Atajo para las herramientas de administración dentro del contenedor de producción.
#   ./despliegue/scripts/herramientas.sh estado
#   ./despliegue/scripts/herramientas.sh config PERMITIR_REGISTRO NO
#   ./despliegue/scripts/herramientas.sh reiniciar-clave alumno@undc.edu.pe
. "$(dirname "$0")/comun.sh"
if $COMPOSE ps --status running app 2>/dev/null | grep -q app; then
  $COMPOSE exec -T app node servidor/herramientas.js "$@"
else
  $COMPOSE run --rm -T app node servidor/herramientas.js "$@"
fi
