#!/usr/bin/env bash
# Migración completa desde la versión 1 (Apps Script).
#   ./despliegue/scripts/importar-v1.sh QSI_migracion_AAAA-MM-DD.zip            en producción
#   ./despliegue/scripts/importar-v1.sh QSI_migracion_AAAA-MM-DD.zip --pruebas  ensayo en el entorno de pruebas
#   (agregue --forzar si el destino ya tiene usuarios: se reemplaza todo, después de un respaldo)
# El .zip lo genera exportarTodo() en la versión 1 (ver docs/MIGRACION.md). También acepta el .xlsx de la hoja.
. "$(dirname "$0")/comun.sh"
requiere_env
archivo="${1:-}"; shift || true
[ -f "$archivo" ] || error "Indique el archivo de la exportación."
servicio=app; carpeta=datos; forzar=""
for a in "$@"; do
  case "$a" in
    --pruebas) servicio=app-pruebas; carpeta=datos-pruebas; COMPOSE="docker compose --profile pruebas" ;;
    --forzar) forzar="--forzar" ;;
  esac
done
[ "$servicio" = app ] && { "$RAIZ/despliegue/scripts/respaldo.sh" 2>/dev/null || true; }
preparar_carpetas
nombre="$(basename "$archivo")"
cp "$archivo" "$carpeta/.importar_$nombre"
$COMPOSE run --rm -T "$servicio" node servidor/herramientas.js importar-v1 "/datos/.importar_$nombre" $forzar
rm -f "$carpeta/.importar_$nombre"
$COMPOSE up -d "$servicio"
$COMPOSE restart "$servicio"
esperar_salud "$servicio" && info "Migración cargada en $servicio. Borre $archivo del servidor cuando verifique que todo está bien."
