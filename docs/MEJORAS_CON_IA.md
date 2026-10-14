# Mejoras rápidas con IA — cómo se cambia la aplicación sin romperla

**Idea central:** José describe la mejora en lenguaje natural; un asistente de programación (Claude) la programa en el repositorio, las pruebas automáticas la verifican, se revisa en **pruebas** y recién entonces se pasa a **producción** con un clic. Nadie edita código en el servidor.

```
 José pide la mejora ──► Claude cambia el código en una rama ──► pruebas automáticas (GitHub)
                                                                     │ verde
                    producción ◄── clic «produccion» ◄── José revisa pruebas.<dominio> ◄── fusión con main
       (respaldo + verificación + vuelta atrás automática)
```

## Roles

| Quién | Hace |
|---|---|
| **José** | Pide las mejoras, revisa en pruebas, aprueba el paso a producción |
| **Claude** (Claude Code o Cowork con el repositorio) | Programa, escribe y ejecuta las pruebas, abre el pull request |
| **GitHub Actions** | Ejecuta las pruebas en cada cambio, publica en pruebas y en producción |
| **Ricardo** | Mantiene el servidor (respaldos, dominio, actualizaciones del sistema); revisa los pull requests grandes |

## El ciclo, paso a paso

1. **Pedir.** Abrir Claude Code en una copia del repositorio (o una sesión de Cowork con el repositorio conectado) y describir la mejora. Claude lee `CLAUDE.md`, que le explica la arquitectura, las reglas y las pruebas.
2. **Rama y pull request.** Claude trabaja en una rama (`mejora/<nombre>`), ejecuta `python3 tools/build.py` y todas las pruebas, agrega pruebas para lo nuevo y abre un pull request con la descripción del cambio.
3. **Pruebas automáticas.** GitHub ejecuta la lógica del servidor (unas 360 pruebas), la versión 2 de punta a punta (Word, PDF, migración), la interfaz en un navegador y la construcción de la imagen. Si algo falla, Claude lo corrige en la misma rama.
4. **Fusión.** Con todo en verde, se fusiona el pull request con `main` (José o Ricardo).
5. **Pruebas en vivo.** La fusión publica sola en `https://pruebas.<dominio>`, que corre la versión nueva con una copia de los datos reales (`refrescar-pruebas.sh`). José la revisa como estudiante, asesor y coordinador.
6. **Producción.** GitHub → Actions → **Desplegar** → *Run workflow* → destino `produccion`. El servidor respalda, publica exactamente la imagen probada, verifica `/salud` y, si falla, vuelve sola a la anterior.
7. **Si algo aparece después:** `./despliegue/scripts/revertir.sh` en el servidor (segundos) o *Run workflow* con una versión anterior en pruebas y luego producción.

Tiempo típico de una mejora pequeña: 15 a 40 minutos de principio a fin, la mayor parte esperando las pruebas.

## Cómo pedir una mejora (plantilla)

> **Qué:** en el borrador, permitir que el asesor deje un comentario por párrafo, no solo por sección.
> **Para quién:** asesor (escribe) y estudiante (lee y marca como atendido).
> **Dónde se ve:** pestaña «Borrador» del expediente del estudiante en el panel del asesor; en la vista del estudiante, junto al párrafo.
> **Reglas:** el coordinador solo lee. Al cambiar el párrafo, el comentario queda «por revisar».
> **Hecho cuando:** hay pruebas del servidor y de la interfaz, y una captura de cada vista.

Consejos:

- Una mejora por pedido. Varias pequeñas se piden por separado (se prueban y se revierten por separado).
- Decir qué **no** debe cambiar si es delicado («sin tocar el formato del Word del plan»).
- Pedir capturas de la interfaz en escritorio y en celular.
- Para cambios de datos: «agrega la columna con un valor por defecto, sin borrar nada». `instalar()` completa lo que falte al publicar.
- Cambios de texto o de configuración muchas veces no requieren código: pestaña Config (`herramientas.sh config CLAVE VALOR`).

## Qué protege a producción

- **Pruebas obligatorias**: nada llega a `main` ni a producción con pruebas en rojo.
- **Entorno de pruebas** con datos reales copiados, separado de producción y con contraseña.
- **Misma imagen**: producción usa exactamente la imagen que se probó (no se reconstruye).
- **Respaldo previo** automático a cada publicación, además del diario.
- **Vuelta atrás automática** si la versión nueva no responde, y manual con `revertir.sh`.
- **Esquema aditivo**: el código nunca borra datos al actualizarse.
- **Reglas en `CLAUDE.md`**: seguridad de claves, privacidad, formato, convenciones; Claude las sigue en cada cambio.

## La versión 1 después del traslado

Queda en Google en modo solo lectura (`SOLO_LECTURA = SI`). Las mejoras se hacen solo en la versión 2. Si alguna vez se necesitara actualizar la 1, el mismo `dist/` sirve para Apps Script (Codigo.gs, Script.html, Estilos.html).

## Versiones

- `VERSION_` en `src/Codigo.gs` (código compartido) y `VERSION_SERVIDOR` en `servidor/runtime/gas.js` (2.x).
- Cada publicación queda etiquetada por su commit (`docker images qsi`); `/salud` muestra cuál está en marcha.
- Las novedades para los usuarios se anotan en la guía de la aplicación (`src/cliente/12_guia.js`).
