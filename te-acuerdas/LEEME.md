# ¿Te acuerdas? — El juego

La presentación «¿Te acuerdas?» convertida en un juego en vivo para unas 30 personas. Son **61 diapositivas**: las 55 de la presentación de Slides (versión 35, la fuente de verdad del diseño), 4 portadas de ronda (Ronda 1, Ronda 2, Ronda 3 y La final, cada una con su entrada de concurso), el muro de respuestas del cierre y el resumen final «¡Gracias, cerebros!».

- **Joss** presenta desde una sola pestaña. Al inicio aparece la sala con el QR, para que todos estén conectados desde la primera pregunta.
- **Los participantes** escanean el QR, eligen su cerebro (20 estilos), su color (10) y su nombre, y contestan en su celular (o en la compu) durante toda la sesión: preguntas en vivo, el número, las dos rondas de las 20 palabras y 6 reacciones con sonido. Al final descargan su **recuerdo en PDF**.
- **Alex** tiene un panel para el reloj, las preguntas, la revisión de respuestas, la tabla y el control remoto de la presentación.

Costo: **$0**. Usa GitHub Pages para la página y el plan gratuito de Firebase para el tiempo real (100 conexiones al mismo tiempo).

## Las páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Joss | La presentación completa y el control del juego |
| `j.html` | Participantes | Entrar con avatar y nombre, contestar preguntas y las dos rondas |
| `alex.html` | Alex | Reloj, preguntas, jugadores, revisión, tabla y ensayo |
| `notas.html` | Joss | El guion de Joss y Alex por diapositiva y por clic, en otra ventana (tecla **N**) o en otro aparato con su link |

## Lo que pasa en cada momento

| Diapositiva | En el celular | En la pantalla |
|---|---|---|
| Sala (2) | Avatar y nombre, luego «Mira la pantalla» | QR y avatares que van llegando |
| ¡Hola, cerebros! | Calificar su memoria del 1 al 10 | Promedio, barras y votos en vivo |
| Portadas de ronda | «RONDA 1 · TU MEMORIA» (y las demás) | Número gigante, título y sonido de concurso |
| ¿Qué recuerdas…? (gancho) | Comentarios libres (80 letras), los que quieran | Todas las burbujas completas, con avatar y nombre |
| Tu límite (miller) | Sí / No | Barras con porcentaje (salen con el primer clic) |
| Memoriza este número | Campo para el número, se abre cuando el número se borra | El primer clic lo muestra 5 s con cuenta regresiva y se oculta solo |
| ¿Quién se lo supo? | «¡Lo recordaste!» o cuántos dígitos acertó | Nombres de quienes lo lograron y cuántos no |
| ¿Cuánto olvidas en un día? | A, B, C o D | Porcentajes con el clic 1; el clic 2 marca la C y cierra el voto |
| Mito 1 a 4 | Verdadero / Falso | Conteo y nombres por columna; el clic que revela cierra el voto |
| El reto (reto + 20 palabras) | «Mira la pantalla» y la palabra en curso | Cada palabra dura 5 s y avanza sola |
| Escribe del 1 al 20 | Ronda 1 (2 min) | Reloj y cuántos ya terminaron |
| ¿Por qué calcetines era el 2? | Comentarios libres, los que quieran | Todas las burbujas completas |
| Las 20 otra vez… en desorden | Ronda 2 (3 min) | Reloj |
| Antes y después | Su resultado | Promedios, mayor mejora y la calificación inicial |
| Tu turno + Muro | Comentarios libres y área (opcional), los que quieran | Muro con todas las tarjetas completas, área y nombre |
| ¡Gracias, cerebros! (resumen) | Su resultado y el botón **Descargar mi recuerdo (PDF)** | Todos los avatares con sus palabras de la ronda 1 → 2 y los datos del grupo |

En la pantalla, cada respuesta lleva el avatar y el **nombre completo** de quien la dio (burbujas, votos A-D y V/F, rangos de resultados, podio y resumen), sin importar cuántos jugadores sean. Si algo no cabe, primero se achica y, si aun así no cabe, **rota solo en carrusel** con puntitos de página. Cada comentario se guarda (los de cada quien quedan en su ficha de jugador).

**Reacciones:** abajo en el celular hay 6 botones (😂 ¡Jajaja!, 👏 ¡Bravo!, 🤯 ¡Me explotó!, 🧠 ¡Cerebrito!, 😴 Zzz, 🎺 ¡Ups!). Salen flotando en la pantalla de Joss con el nombre de quien la mandó y un sonido chistoso. Se apagan mientras pasan las palabras y durante las rondas.

**El recuerdo en PDF** (3 páginas, con su nombre, la fecha y su avatar): 1) su lugar, ronda 1 → ronda 2, los números que acertó y todas sus respuestas; 2) cómo jugó el grupo, con todos los avatares y el muro; 3) una guía corta (agrupa, repasa espaciado, recuerda sin ver, asocia), el código del 1 al 20 y el gancho de su área. Se arma en el mismo celular, sin servidor.

Entre preguntas, el celular muestra el avatar y «Mira la pantalla»: nadie se queda en una pregunta vieja. Las preguntas no suman puntos al podio, que sigue siendo ronda 1 + ronda 2.

## Puesta en marcha

Ya está hecha: el proyecto de Firebase `te-acuerdas` está configurado en `js/config.js`. Solo falta **pegar de nuevo las reglas** de [`database.rules.json`](database.rules.json) en Firebase (Realtime Database → Reglas → Publicar), porque ahora incluyen las reacciones y los avatares con color. Si faltan, al crear la sala aparece un **aviso rojo** en la pantalla de Joss; mientras tanto los celulares sí entran, pero con su cerebro sin color y sin reacciones.

GitHub Pages publica la rama `claude/quirky-albattani-hw1yvk`:

- **Joss:** <https://desarrollo-profesional-sys.github.io/consultas/te-acuerdas/>
- **Participantes:** entran con el QR o con el link que Alex pega en el chat.

Para ensayar sin Firebase y sin celulares, agrega `?ensayo&segundos=20` al final del link de Joss. Todo corre en su compu: cada pestaña de `j.html` es un «celular» y las rondas duran 20 segundos. En el panel de Alex, **Ensayo → Agregar jugadores de prueba**: los bots también votan, califican, escriben el número y mandan frases; **Reacciones de prueba** los pone a reaccionar 10 segundos.

## El día del evento

**Antes de compartir pantalla (Joss)**

1. Abre la página en Chrome y toca **Crear sala nueva**. Si hiciste pruebas, que sea una sala distinta a la del ensayo.
2. Copia el **link del panel** y mándaselo a Alex por privado. No lo compartas con el grupo.
3. Toca **▶ Empezar presentación** y comparte esa pestaña. Si quieres que se oigan los sonidos, activa «compartir audio de la pestaña».
4. Toca **Abrir mis notas (guion)** (o la tecla **N**): es otra ventana que no compartes, con lo que dice Joss y lo que dice Alex en cada diapositiva y en cada clic. Lo que toca ahora se marca en verde y el próximo clic se anuncia. Si el navegador bloquea la ventana, abre en el celular o la tablet el link de **Tus notas en el celular o la tablet** (está en el menú): el guion cambia solo con cada diapositiva.

**Alex**

1. Abre el link del panel.
2. En la diapositiva de la sala, toca **Copiar link para el chat** y pégalo en el chat de la videollamada.
3. En **En vivo** ve su parte del guion resaltada («TÚ (ALEX)») y el clic en que va Joss; puede mover la presentación y pausar las palabras.
4. En **Preguntas** puedes abrir o cerrar cualquier pregunta a mano y **ocultar una respuesta de texto** antes de que salga en pantalla.

**Teclas de Joss**

| Tecla | Qué hace |
|---|---|
| →, clic, espacio o control remoto | Siguiente |
| ← | Anterior |
| **P** | Pausa o reanuda el avance automático de las 20 palabras (también desde el panel de Alex y la ventana de notas) |
| F | Pantalla completa |
| N | Notas con el guion en otra ventana |
| S | Sonido sí / no |
| M | Menú y links de la sala |

**Cómo corre cada parte**

- **Las 20 palabras:** el primer clic en «El reto» entra a la palabra 1. Desde ahí cada palabra se queda 5 s con su anillo de cuenta regresiva y avanza sola. En la 20 se detiene; el siguiente clic lleva a «Escribe del 1 al 20». Avanzar con → salta a la siguiente palabra; retroceder con ← pausa el avance. Se ajusta con `WORD_SECONDS` en `js/config.js`.
- **Las rondas:** en «Escribe del 1 al 20» y en «Las 20 otra vez», el clic arranca el reloj en la pantalla y en todos los celulares. Al llegar a cero se bloquean solos. Si todos terminan antes, la ronda se cierra sola. Mientras corre, dos clics seguidos la cierran.
- **Si se recarga la página de Joss:** toca **Continuar sala** y regresa a la misma diapositiva sin perder nada.

## Cómo se califica

- **1 punto** por palabra escrita **en su número**. La tabla final suma ronda 1 + ronda 2 (máximo 40).
- Se aceptan respuestas sin acentos, en plural o singular, con un error de dedo, y sinónimos (coche, INE, tapabocas, compu, celular, nave espacial, ∞…).
- Si una respuesta se parece más a otra palabra de la lista, no cuenta. Por ejemplo, «manos» en la 20 no vale porque es la 10.
- Alex puede marcar cualquier respuesta como buena o mala en **Revisar respuestas**. Se aplica a todos los que la escribieron.
- **Empates:** mismo puntaje, mismo lugar (1, 1, 1, 2, 3…). En el podio los empatados suben juntos al escalón y del 4.º lugar en adelante salen todos.

## Cambiar cosas

- **Duración de las rondas y de cada palabra:** `ROUND_SECONDS` y `WORD_SECONDS` en `js/config.js`.
- **Palabras, sinónimos y explicaciones:** `WORDS` en `js/game.js`.
- **Preguntas en vivo (textos, opciones, respuesta correcta, áreas):** `QUESTIONS` en `js/game.js`.
- **Guion de Joss y Alex y ganchos por área:** `GUION` y `AREA_HOOKS` en `js/guion.js`. El mismo guion, para imprimir, está en `guion/Guion-Te-acuerdas.pdf`; si lo cambias, vuelve a generarlo con `node tools/guion-pdf.mjs`.
- **Cerebros y colores de los avatares:** `AVATARS` y `COLORS` en `js/avatars.js`. **Reacciones y sonidos:** `REACTIONS` y `sfx` en `js/fx.js`.
- **El PDF del recuerdo:** `js/recuerdo.js`.
- **Diapositivas:** edita `slides/<id>.html` (el orden está en `slides/deck.json`) y corre `node tools/build-slides.mjs`. Los elementos con `data-live="…"` los llena el juego con datos reales.

## Después del evento

El repositorio es público: cualquiera con la dirección puede ver el código. Las respuestas de la gente viven solo en Firebase. Para borrarlas: **Realtime Database → Datos → `rooms` → eliminar**.

## Para desarrollo

```bash
cd te-acuerdas/tools && npm install   # solo herramientas; la página no necesita compilarse
node vendor.mjs                       # vuelve a copiar Firebase, jsPDF + html2canvas, QR, fuentes e íconos
cd .. && npx http-server -p 8080 -c-1 .
node tools/e2e.mjs                    # ensayo automático: Joss + Alex + 3 celulares + 25 bots, las 61 diapositivas, notas por clic, reacciones y PDF
node tools/responsive.mjs             # revisa que nada se salga de la pantalla en celulares de 320 a 768 px, acostados, tablet y compu
node tools/guion-pdf.mjs              # vuelve a generar guion/Guion-Te-acuerdas.pdf desde js/guion.js
```
