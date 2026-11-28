# aogd-ec
Arquitectura Operativa y Gobierno Digital — E-commerce y Canales FESA

## Estilos de las herramientas (Tailwind compilado)

Las herramientas de `herramientas/` ya no cargan Tailwind desde el CDN: usan `herramientas/tailwind.css`, compilado una sola vez.
Cuando se agregue o cambie una clase de Tailwind en cualquier `.html` o `.js` de `herramientas/`, hay que regenerarlo:

```bash
bash herramientas/construir-css.sh
```

(Requiere Node; descarga `tailwindcss@3.4.17` con `npx`.) Si una clase nueva no se ve, casi siempre es que falta este paso.
