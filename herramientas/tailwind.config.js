// Tailwind se compila una sola vez a tailwind.css (ver construir-css.sh). No se usa el CDN en tiempo de ejecución.
module.exports = { content: ['./*.html', './*.js'], theme: { extend: {} } };
