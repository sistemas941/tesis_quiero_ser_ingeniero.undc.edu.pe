#!/usr/bin/env bash
# Copia los datos actuales de producción al entorno de pruebas (para probar mejoras con datos reales).
. "$(dirname "$0")/comun.sh"
[ -f datos/qsi.sqlite ] || error "Aún no hay datos de producción."
$COMPOSE --profile pruebas stop app-pruebas 2>/dev/null || true
rm -rf datos-pruebas && mkdir -p datos-pruebas
if $COMPOSE ps --status running app 2>/dev/null | grep -q app; then
  $COMPOSE exec -T app node servidor/herramientas.js respaldo-bd /datos/.pruebas.sqlite >/dev/null
  mv datos/.pruebas.sqlite datos-pruebas/qsi.sqlite
else
  cp datos/qsi.sqlite datos-pruebas/qsi.sqlite
fi
cp -r datos/archivos datos-pruebas/archivos
preparar_carpetas
info "Datos de producción copiados a pruebas."
