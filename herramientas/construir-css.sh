#!/usr/bin/env bash
# Regenera herramientas/tailwind.css. Ejecutar SIEMPRE que se agregue o cambie una clase de Tailwind en los .html o .js de herramientas/.
# Uso: bash herramientas/construir-css.sh
set -euo pipefail
cd "$(dirname "$0")"
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i tailwind.in.css -o tailwind.css --minify
