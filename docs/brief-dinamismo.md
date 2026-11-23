# Brief: preguntas dinámicas, vistosas y claras (todos los juegos)

Petición del padre: "cuando hay preguntas, ponlas más dinámicas, no son tan chulas; por dentro los juegos no llaman la atención, deben ser interactivos y llamativos para el niño; deja claro dónde está todo (preguntas, respuestas, ayuda), para que repasen y aprendan".

## Capa común ya disponible: `platform/juice.js`

`<script src="../platform/juice.js"></script>` (después de los scripts de platform, antes del juego). Expone `Juice`:

- `Juice.correct(el, {streak})`: acierto: sonido, "pop" del elemento, confeti, vibración, mensaje flotante de ánimo en el idioma elegido.
- `Juice.wrong(el)`: fallo suave: zumbido bajo, sacudida, mensaje "casi, inténtalo otra vez". Nunca castigar.
- `Juice.levelUp(el)`, `Juice.tick()`, `Juice.burst(x,y)`, `Juice.floatText(x,y,text)`, `Juice.praise(streak)`.
- `Juice.mountSoundToggle(parent)`: botón 🔊/🔇 (recordado). Colócalo en la barra superior de cada juego.
Respeta `prefers-reduced-motion` y el interruptor de sonido. No lo modifiques (no está en tu lista de ficheros); si te falta algo, hazlo localmente en tu juego y anótalo en el informe.

## Qué debe cumplir cada juego

1. **Zonas claras y rotuladas**: arriba, barra con "Pregunta 3 de 10" (o nivel/lección), barra de progreso animada, racha y puntos; en el centro, la pregunta grande y vistosa (emoji o ilustración SVG grande, no solo texto); abajo, la zona de respuesta con una etiqueta ("Elige", "Escribe", "Arrastra"); un botón de ayuda 💡 siempre visible y un botón de salir. Nada escondido: el niño debe saber qué se espera de él sin leer instrucciones largas (una frase corta y un icono).
2. **Respuestas llamativas**: botones grandes (>= 56 px), colores diferenciados con icono o forma (estilo Kahoot: triángulo, rombo, círculo, cuadrado, o emojis), con efecto al pulsar (hundirse), entrada escalonada y transición animada entre preguntas (deslizar o zoom suave, 200-300 ms).
3. **Reacción inmediata y alegre**: acierto con `Juice.correct` y la respuesta correcta resaltada; fallo con `Juice.wrong`, mostrando después el porqué en una frase (ya hay explicaciones en varios juegos: mantenlas y hazlas visibles, no un texto pequeño). Racha visible con llama o estrellas que suben; barra de XP o de progreso que se llena con animación; al terminar, pantalla de resultados con estrellas que aparecen una a una y confeti en las buenas rondas.
4. **Variedad de formatos** (elige al menos 2 por juego, adecuados a la edad y al contenido, sin sobrecargar): tocar el globo o la burbuja con la respuesta correcta entre varias que flotan, arrastrar y soltar la respuesta en un hueco, ordenar elementos, unir parejas con líneas, verdadero o falso con deslizamiento, escuchar y elegir (si hay voz del navegador), completar con teclado propio, ronda relámpago con tiempo suave (sin game over). Los formatos nuevos deben dar la misma información pedagógica que los actuales, y ser accesibles también con teclado.
5. **Móvil y web**: móvil primero (360-430 px), sin scroll horizontal, objetivos táctiles >= 48 px, y en pantalla ancha aprovechar el espacio (la pregunta y las respuestas no se quedan minúsculas en un rincón). Teclado: números y letras para responder, Enter para continuar, Esc para salir cuando ya exista.
6. **Idiomas**: todo texto nuevo en es, en, eu, gl, ca, fr con las mismas claves. Los textos largos pueden usar es y en con respaldo, pero las etiquetas de interfaz (Pregunta, Elige, Ayuda, Racha, Siguiente) van en los seis.
7. **Rendimiento y accesibilidad**: sin librerías externas; animaciones con transform y opacity; `prefers-reduced-motion` desactiva movimiento; texto de usuario siempre con `textContent`; contraste suficiente; atributos aria en botones de icono.
8. **Pruebas**: no rompas las existentes (`cd tests && npm test` al final; los tests de cada juego ya existen). Añade tests de navegador (playwright-core con chrome, patrón de `tests/front/mapas.test.mjs`, `serviceWorkers: 'block'`, `locale: 'es-ES'`, 390x844 y 1280x800) que comprueben: etiquetas de zona visibles ("Pregunta N de M"), botón de ayuda presente, al acertar aparece el efecto (clase `jx-ok` o elemento `.jx-float`), al fallar sale el porqué, formatos nuevos funcionan con ratón y teclado, sin errores de consola, sin scroll horizontal.
9. **No** cambies la lógica de puntuación ni de progreso guardado, ni el contenido de las preguntas salvo para presentarlo mejor. No toques `platform/`, `sw.js`, el `index.html` de la raíz ni juegos que no estén en tu lista.

## Informe final

Por juego: qué ve ahora el niño (antes y después en 2 frases), formatos nuevos, ficheros tocados, resultados de pruebas, dudas. Sin emojis en comentarios de código; sin rayas largas en textos de usuario.
