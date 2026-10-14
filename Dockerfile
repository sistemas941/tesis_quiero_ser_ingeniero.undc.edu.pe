# ¡Quiero ser Ingeniero! - versión 2 (servidor propio)
# Imagen multiarquitectura: sirve en servidores x86_64 y ARM (por ejemplo, Huawei Cloud Kunpeng).

# 1) Se construye dist/ a partir de src/ (el mismo paso que para Apps Script)
FROM python:3.12-slim AS construir
WORKDIR /app
COPY tools tools
COPY src src
RUN python3 tools/build.py

# 2) Servidor: Node.js 22 (incluye SQLite) y LibreOffice solo para convertir Word a PDF
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    TZ=America/Lima \
    HOME=/tmp \
    DATOS=/datos \
    DIST=/app/dist \
    PUERTO=3000
RUN apt-get update \
 && apt-get install -y --no-install-recommends libreoffice-writer-nogui fonts-liberation fonts-dejavu-core fonts-crosextra-carlito tini ca-certificates tzdata \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /datos && chown node:node /datos
WORKDIR /app
COPY --chown=node:node servidor servidor
COPY --from=construir --chown=node:node /app/dist dist
ARG VERSION=desarrollo
ENV QSI_COMPILACION=$VERSION
USER node
EXPOSE 3000
VOLUME ["/datos"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "servidor/principal.js"]
