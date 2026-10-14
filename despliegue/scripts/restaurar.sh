#!/usr/bin/env bash
# Restaura producción desde un respaldo. Lo que había se conserva en datos.antes_AAAAMMDD_HHMM.
#   ./despliegue/scripts/restaurar.sh respaldos/qsi_20261201_0230.tar.gz
. "$(dirname "$0")/comun.sh"
archivo="${1:-}"
[ -f "$archivo" ] || error "Indique el respaldo: ./despliegue/scripts/restaurar.sh respaldos/qsi_....tar.gz"
read -r -p "Se detendrá la aplicación y se restaurará $archivo. ¿Continuar? (si/no) " r
[ "$r" = "si" ] || exit 1
$COMPOSE stop app
antes="datos.antes_$(date +%Y%m%d_%H%M)"
mv datos "$antes"
mkdir -p datos
tar -xzf "$archivo" -C datos
preparar_carpetas
$COMPOSE up -d app
esperar_salud app && info "Restaurado. Lo anterior quedó en $antes" || error "La aplicación no responde tras restaurar; lo anterior está en $antes"
