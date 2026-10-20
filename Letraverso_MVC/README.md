# Letraverso — juego de búsqueda de palabras MVC

Juego educativo realizado con HTML5, CSS3 y JavaScript ES6 puro, sin frameworks.

## Ejecutar
1. Extrae el ZIP completo.
2. Abre `index.html` en Chrome, Edge o Firefox.
3. Observa la ilustración y encuentra las letras en el orden correcto.

## Tablero y dificultad
- Fácil: alrededor de 110 letras distractoras, además de la palabra objetivo.
- Normal: alrededor de 190 letras distractoras, además de la palabra objetivo.
- Experto: alrededor de 250 letras distractoras, además de la palabra objetivo.
- Los niveles superiores añaden distractores.
- Las fichas ocupan toda la altura y anchura del tablero, con posiciones mezcladas y ligeramente desplazadas para que no parezcan filas perfectas.
- Las fichas tienen separación visible y el tablero aumenta su altura cuando se necesitan más letras.

## Mecánicas
- Vidas persistentes entre niveles; al perder, se puede reintentar.
- Conexiones visibles entre letras correctas.
- Se puede deshacer una selección tocando una ficha seleccionada.
- Los errores consumen vidas y se proporciona ayuda gradual.
- Las palabras se recorren en orden aleatorio sin repetirse hasta agotar el banco.
- Cada palabra tiene una ilustración SVG local sin el nombre de la respuesta.

## MVC
- `model.js`: palabras, dificultad, vidas, niveles y validación.
- `view.js`: canvas, posiciones, conexiones y pista visual.
- `controller.js`: coordina acciones y estado.
- `app.js`: punto de entrada.
