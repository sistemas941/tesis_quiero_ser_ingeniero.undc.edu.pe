# -*- coding: utf-8 -*-
"""Construye dist/ a partir de src/: genera la semilla de la rubrica, convierte todo a ASCII
(\\uXXXX en codigo; entidades en HTML) y valida las convenciones del proyecto."""
import json, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SRC, DIST = RAIZ / "src", RAIZ / "dist"
DIST.mkdir(exist_ok=True)


def js_ascii(t):
    return "".join(c if ord(c) < 128 else "".join("\\u%04x" % u for u in _utf16(c)) for c in t)


def _utf16(c):
    o = ord(c)
    if o < 0x10000:
        return [o]
    o -= 0x10000
    return [0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)]


def html_ascii(t):
    return "".join(c if ord(c) < 128 else "&#%d;" % ord(c) for c in t)


def css_ascii(t):
    return "".join(c if ord(c) < 128 else "\\%06x" % ord(c) for c in t)


def rubrica_gs():
    items = json.loads((RAIZ / "tools" / "rubrica.json").read_text(encoding="utf8"))
    return ("/** SemillaRubrica.gs - Rubrica de evaluacion del proyecto de tesis (UNDC). Generado desde el Excel oficial. */\n"
            "var SEMILLA_RUBRICA = " + json.dumps(items, ensure_ascii=False, indent=1) + ";\n")


def main():
    for f in DIST.glob("*"):
        f.unlink()
    (SRC / "SemillaRubrica.gs").write_text(rubrica_gs(), encoding="utf8")
    errores = []
    # Todo el servidor va en un solo archivo, Codigo.gs, en este orden
    orden = ["Codigo", "Acceso", "Datos", "Verificaciones", "IA", "Referencias", "Importar", "Documento", "Ecuaciones", "Informe", "Padron", "Migracion", "Semilla", "SemillaRubrica", "Escudo"]
    faltan = {f.stem for f in SRC.glob("*.gs")} ^ set(orden)
    if faltan:
        errores.append("archivos .gs fuera del orden de union: " + ", ".join(sorted(faltan)))
    partes_gs = []
    for n in orden:
        partes_gs.append("// " + "=" * 96 + "\n// " + n + "\n// " + "=" * 96 + "\n" + (SRC / (n + ".gs")).read_text(encoding="utf8").rstrip() + "\n")
    t = js_ascii("\n".join(partes_gs))
    if "`" in t:
        errores.append("Codigo.gs: contiene plantillas literales (acento grave)")
    # Apps Script une todos los archivos en un solo ambito: dos funciones con el mismo nombre se pisan sin aviso
    nombres = re.findall(r"^function\s+([A-Za-z0-9_$]+)\s*\(", t, re.M)
    repetidas = sorted({n for n in nombres if nombres.count(n) > 1})
    if repetidas:
        errores.append("Codigo.gs: funciones repetidas: " + ", ".join(repetidas))
    (DIST / "Codigo.gs").write_text(t, encoding="ascii")
    # El cliente se escribe por partes en src/cliente y aqui se une en dos archivos
    partes = sorted((SRC / "cliente").glob("*.js"))
    js = "\n".join(p.read_text(encoding="utf8") for p in partes)
    nombres = re.findall(r"^function\s+([A-Za-z0-9_$]+)\s*\(", js, re.M)
    repetidas = sorted({n for n in nombres if nombres.count(n) > 1})
    if repetidas:
        errores.append("cliente: funciones repetidas: " + ", ".join(repetidas))
    (SRC / "Script.html").write_text("<script>\n(function () {\n'use strict';\n" + js + "\n})();\n</script>\n", encoding="utf8")
    (SRC / "Estilos.html").write_text("<style>\n" + (SRC / "cliente" / "estilos.css").read_text(encoding="utf8") + "</style>\n", encoding="utf8")
    for f in sorted(SRC.glob("*.html")):
        t = f.read_text(encoding="utf8")
        if f.name == "Script.html":
            t = js_ascii(t)
        elif f.name == "Estilos.html":
            t = css_ascii(t)
        else:
            t = html_ascii(t)
        if "`" in t:
            errores.append(f"{f.name}: contiene plantillas literales (acento grave)")
        if len(re.findall(r"</script>", t, re.I)) > 1:
            errores.append(f"{f.name}: mas de un </script>")
        if re.search(r"<script[^>]+src\s*=", t, re.I):
            errores.append(f"{f.name}: carga un script externo")
        (DIST / f.name).write_text(t, encoding="ascii")
    (DIST / "appsscript.json").write_text(json.dumps({
        "timeZone": "America/Lima", "dependencies": {}, "exceptionLogging": "STACKDRIVER", "runtimeVersion": "V8",
        "webapp": {"executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS"}}, indent=2), encoding="ascii")
    for f in sorted(DIST.glob("*")):
        try:
            f.read_text(encoding="ascii")
        except UnicodeDecodeError:
            errores.append(f"{f.name}: no es ASCII")
    if errores:
        print("ERRORES:\n  " + "\n  ".join(errores)); sys.exit(1)
    print("dist listo:", ", ".join(f"{f.name} ({f.stat().st_size // 1024} KB)" for f in sorted(DIST.glob("*"))))


if __name__ == "__main__":
    main()
