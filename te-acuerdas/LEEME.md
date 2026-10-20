# ¿Te acuerdas? — El juego

La presentación «¿Te acuerdas?» convertida en un juego en vivo para unas 30 personas:

- **Joss** presenta desde una sola pestaña: las 47 diapositivas originales y 3 nuevas (la sala con QR, el antes y después, y el podio).
- **Los participantes** escanean un QR, eligen avatar, escriben su nombre y contestan las dos rondas en su celular (o en la compu).
- **Alex** tiene un panel para controlar el reloj, corregir respuestas, ver la tabla y mover la presentación si hace falta.

Costo: **$0**. Usa GitHub Pages para la página y el plan gratuito de Firebase para el tiempo real (admite 100 conexiones al mismo tiempo).

## Las páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Joss | La presentación completa y el control del juego |
| `j.html` | Participantes | Entrar con avatar y nombre, y contestar las dos rondas |
| `alex.html` | Alex | Reloj, jugadores, revisión de respuestas, tabla y ensayo |
| `notas.html` | Joss | Notas del orador en otra ventana (tecla **N**) |

## Puesta en marcha (una sola vez, unos 15 minutos)

### 1. Firebase: el tiempo real

1. Entra a <https://console.firebase.google.com> con tu cuenta de Google y elige **Crear un proyecto**. Ponle `te-acuerdas` y desactiva Google Analytics.
2. En el menú, ve a **Compilación → Realtime Database → Crear base de datos**. Elige la ubicación **Estados Unidos (us-central1)** y **Comenzar en modo bloqueado**.
3. En la pestaña **Reglas** de esa base de datos, borra todo y pega el contenido de [`database.rules.json`](database.rules.json). Luego **Publicar**.
4. Ve a **Compilación → Authentication → Comenzar → Método de acceso → Anónimo**, actívalo y guarda.
5. Abre el engrane ⚙️ **Configuración del proyecto**. En **Tus apps**, toca el ícono web `</>`, registra la app como `te-acuerdas` (sin Hosting) y copia el bloque `firebaseConfig`. Debe incluir la línea `databaseURL`.
6. Pega ese bloque en [`js/config.js`](js/config.js), en lugar de `null`. Estos datos no son secretos: están hechos para ir en la página.

### 2. GitHub Pages: la dirección web

En el repositorio, ve a **Settings → Pages**:

- **Source:** «Deploy from a branch»
- **Branch:** `claude/quirky-albattani-hw1yvk`
- **Carpeta:** `/ (root)`

Guarda y espera uno o dos minutos. Queda en:

- **Joss:** <https://desarrollo-profesional-sys.github.io/consultas/te-acuerdas/>
- **Participantes:** se entra con el QR o con el link que Alex pega en el chat.

### 3. Prueba de 5 minutos (con celulares reales)

1. Joss abre la página, toca **Crear sala nueva** y luego **Abrir el panel de Alex**.
2. En el panel: **Ensayo → Agregar 25 jugadores de prueba**.
3. Dos o tres personas escanean el QR de la diapositiva «¡Saquen el celular!» y entran.
4. Joss avanza hasta «Escribe del 1 al 20», da clic para arrancar el reloj y todos contestan.
5. Revisa que salgan los resultados, la gráfica, el antes y después y el podio.
6. Para el evento real, **crea una sala nueva**: así no quedan los datos de la prueba.

Para ensayar sin Firebase y sin celulares, abre la página con `?ensayo&segundos=20` al final. Todo corre en tu compu: cada pestaña de `j.html` es un «celular» y las rondas duran 20 segundos.

## El día del evento

**Joss, antes de compartir pantalla**

1. Abre la página en Chrome y toca **Crear sala nueva**.
2. Copia el **link del panel** y mándaselo a Alex por privado (WhatsApp). No lo compartas con el grupo.
3. Toca **▶ Empezar presentación** (entra en pantalla completa).
4. Comparte esa pestaña en la videollamada. Si quieres que se oigan los sonidos, activa «compartir audio de la pestaña».

**Alex**

1. Abre el link del panel.
2. En la diapositiva de la sala, toca **Copiar link para el chat** y pégalo en el chat de la videollamada.

**Durante el juego**

- **→, clic, espacio o el control remoto:** siguiente. **←:** anterior. **F:** pantalla completa. **N:** notas. **S:** sonido. **M:** menú y links.
- En «Escribe del 1 al 20» (ronda 1, 2 minutos) y en «Las 20 otra vez… en desorden» (ronda 2, 3 minutos), **el clic arranca el reloj** en la pantalla y en todos los celulares.
- Al llegar a 0:00 los celulares se bloquean solos y guardan lo que alcanzaron a escribir. Si todos terminan antes, la ronda se cierra sola.
- Si se recarga la página de Joss, toca **Continuar sala**: regresa a la misma diapositiva sin perder nada.

## Cómo se califica

- **1 punto** por cada palabra escrita **en su número**. La clasificación final suma ronda 1 + ronda 2 (máximo 40).
- Se aceptan respuestas sin acentos, en plural o en singular, con un error de dedo, y sinónimos comunes (coche, INE, tapabocas, pelota…).
- Si una respuesta se parece más a otra palabra de la lista, no cuenta. Por ejemplo, «manos» en la 20 no vale porque es la 10.
- Alex puede marcar cualquier respuesta como buena o mala en **Revisar respuestas**. Se aplica a todos los que la escribieron, y la pantalla y la tabla se actualizan solas.
- **Empates:** gana quien sacó más en la ronda 2, y luego quien terminó primero.

## Cambiar cosas

- **Duración de las rondas:** `ROUND_SECONDS` en `js/config.js`.
- **Palabras, sinónimos y explicaciones:** `WORDS` en `js/game.js`.
- **Diapositivas:** edita `slides/<id>.html` (el orden está en `slides/deck.json`) y luego corre `node tools/build-slides.mjs`.

## Después del evento

El repositorio es público: cualquiera con la dirección puede ver el código y las notas de las diapositivas. Las respuestas de la gente viven solo en Firebase. Cuando termines, puedes borrarlas en **Realtime Database → Datos → `rooms` → eliminar**.

## Para desarrollo

```bash
cd te-acuerdas/tools && npm install   # solo herramientas; la página no necesita compilarse
node vendor.mjs                       # vuelve a copiar Firebase, QR, fuentes e íconos
cd .. && npx http-server -p 8080 -c-1 .
node tools/e2e.mjs                    # ensayo automático: Joss + Alex + 3 celulares + 25 bots
```
