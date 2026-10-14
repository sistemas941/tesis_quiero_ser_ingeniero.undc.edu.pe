#!/usr/bin/env bash
# Respaldo completo de producción: base de datos (copia consistente, en caliente) y archivos.
# Deja respaldos/qsi_AAAAMMDD_HHMM.tar.gz y conserva los últimos $GUARDAR (14 por defecto).
# Se programa a diario con cron (lo hace instalar-servidor.sh).
. "$(dirname "$0")/comun.sh"
GUARDAR="${GUARDAR:-14}"
fecha="$(date +%Y%m%d_%H%M)"
mkdir -p respaldos
[ -f datos/qsi.sqlite ] || error "No hay datos de producción que respaldar."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
if $COMPOSE ps --status running app 2>/dev/null | grep -q app; then
  $COMPOSE exec -T app node servidor/herramientas.js respaldo-bd /datos/.respaldo.sqlite >/dev/null
  mv datos/.respaldo.sqlite "$tmp/qsi.sqlite"
else
  cp datos/qsi.sqlite "$tmp/qsi.sqlite"
fi
tar -czf "respaldos/qsi_$fecha.tar.gz" -C "$tmp" qsi.sqlite -C "$RAIZ/datos" archivos
ls -1t respaldos/qsi_*.tar.gz | tail -n +"$((GUARDAR + 1))" | xargs -r rm -f
info "Respaldo listo: respaldos/qsi_$fecha.tar.gz ($(du -h "respaldos/qsi_$fecha.tar.gz" | cut -f1))"
# Copia fuera del servidor (recomendado): defina DESTINO_REMOTO en .env, por ejemplo usuario@otro-servidor:/respaldos/qsi
if [ -f .env ]; then set -a; . ./.env; set +a; fi
if [ -n "${DESTINO_REMOTO:-}" ]; then
  scp -q "respaldos/qsi_$fecha.tar.gz" "$DESTINO_REMOTO/" && info "Copiado a $DESTINO_REMOTO" || aviso "No se pudo copiar a $DESTINO_REMOTO"
fi
