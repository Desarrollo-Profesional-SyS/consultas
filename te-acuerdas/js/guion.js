// Guion de los conductores, diapositiva por diapositiva y clic por clic. Se ve en la
// ventana de notas de Joss (tecla N) y en el panel de Alex; nunca en la pantalla compartida.
// t = minuto aproximado · beats = momentos de la diapositiva: «Al entrar», cada clic de
// Joss (click: n) o «Mientras…» · lines = quién dice qué, en orden (J = Joss, A = Alex) ·
// tip = indicación técnica.

// Ganchos para recordar, por área (para el cierre, el muro y el PDF).
export const AREA_HOOKS = [
  ['Eje Cursos', 'El temario de un curso, colgado del código: el módulo 1 es el sol (la idea central), el 2 son los calcetines (el par de herramientas) y el 3 el semáforo (los tres pasos).'],
  ['Recursos Humanos', 'Cada paso de la inducción, colgado de un lugar de la oficina: recepción = papeles, cocina = cultura, sala de juntas = metas. Se recorre la oficina y se recorre el proceso.'],
  ['Sistemas', 'Los pasos de soporte, agrupados y con la misma letra: Revisar, Reiniciar, Reportar. Y los folios o claves largas, en bloques de 3 o 4 como el 55-1827-4390.'],
  ['Publicidad', 'Cada métrica con una pregunta: alcance = ¿me vieron?, clics = ¿me eligieron?, conversión = ¿me compraron?'],
  ['Administración', 'Cada fecha límite colgada de algo que ya pasa ese día: el pago a proveedores, en la quincena; el cierre, el último viernes del mes.'],
  ['Eje Empresas', 'Cada cliente empresa con una imagen y la historia de un caso real: la objeción de «es muy caro» se cuelga del cliente que recuperó la inversión en 3 meses.'],
  ['Diseño', 'Las reglas de marca con imagen: el logo «respira» (margen mínimo), la paleta es «el semáforo de la marca» (un color para cada uso).'],
  ['Ejecutiva Directiva', 'Tres prioridades con números-gancho: 1, el sol (el objetivo del año); 2, los calcetines (el par de métricas que importan); 3, el semáforo (los riesgos en rojo, amarillo y verde).'],
];

const enter = (...lines) => ({ cue: 'Al entrar', lines });
const click = (n, cue, ...lines) => ({ click: n, cue, lines });
const during = (cue, ...lines) => ({ cue, lines });
const J = (t) => ['J', t];
const A = (t) => ['A', t];
const COVER_TIP = 'La portada suena sola. Den el siguiente clic cuando termine la música.';

export const GUION = {
  cover: {
    t: '0:00–1:00',
    beats: [enter(
      J('¡Buenos días a todos! Qué gusto verlos. Hoy no venimos a darles una plática: venimos a jugar.'),
      A('Y de una vez les aviso: al final hay un reto de 20 palabras que casi nadie pasa a la primera. Así que vayan calentando.'),
      J('Y lo mejor: esta sí es una capacitación que van a recordar. Literal, de eso se trata.'),
    )],
    tip: 'Compartan esta pestaña antes de que entre la gente. No digan la palabra «asociación» en toda la primera parte: la sorpresa sostiene la sesión.',
  },
  sala: {
    t: '1:00–3:00',
    beats: [
      enter(
        J('Para jugar necesitan su celular. Escaneen el código de la pantalla, elijan su cerebro, su color y pongan su nombre.'),
        A('Si están desde la compu, les dejo el link en el chat. Y piensen bien el nombre, porque va a salir en pantalla todo el rato.'),
      ),
      during('Mientras van entrando',
        A('(Lee algunos nombres conforme llegan.) Ahí viene llegando Caro… ¡bienvenido, Luis!'),
        J('Abajo en su celular tienen unos botones de reacciones, cada uno con su sonido. Pruébenlos, sin pena.'),
        A('(Cuando suene alguno.) Ya alguien mandó un «Zzz»… y eso que apenas vamos empezando.'),
      ),
    ],
    tip: 'Alex: «Copiar link para el chat» en su panel. Esperen a que el contador llegue a casi todos; quien llegue tarde también juega.',
  },
  despierta: {
    t: '3:00–4:30',
    beats: [
      enter(
        J('Bueno, ahora sí nos presentamos. Yo soy Joss y voy a ir llevando el juego.'),
        A('Y yo soy Alex: cuido el reloj, las respuestas y que nadie se pase de listo.'),
        J('Primera pregunta, y aquí no hay respuestas malas: del 1 al 10, ¿qué tan buena creen que es su memoria? Califíquenla en el celular.'),
      ),
      during('Mientras votan',
        A('(Lee el promedio en vivo.) Vamos en… ¡y alguien se puso un 10! Qué seguridad, eh.'),
        J('Acuérdense de su número, porque al final se lo vamos a volver a preguntar.'),
        A('Bueno… si nos acordamos.'),
      ),
    ],
    tip: 'La votación se abre sola al entrar y se cierra al pasar a la siguiente.',
  },
  reglas: {
    t: '4:30–5:30',
    beats: [enter(
      J('Así va a estar el juego: tres rondas cortitas y una gran final.'),
      A('Primero vemos cómo funciona su memoria, luego conocemos al olvido, después desmentimos unos mitos y cerramos con el reto de las 20 palabras.'),
      J('Lo único que les pedimos: cámara prendida, celular a la mano y estar conectados a la sala.'),
      A('Y una regla que no viene escrita: nada de apuntar. Aquí todo es de memoria.'),
    )],
  },
  'ronda-1': {
    t: '5:30–5:45',
    beats: [enter(
      J('¡Arrancamos con la ronda 1: tu memoria!'),
      A('Esto es puro calentamiento. Aquí no se estiran las piernas: se estira el cerebro.'),
    )],
    tip: COVER_TIP,
  },
  gancho: {
    t: '5:45–7:30',
    beats: [
      enter(
        J('Para calentar, una pregunta sencilla: ¿qué recuerdan de la última capacitación que tomaron? Escríbanlo en su celular.'),
        A('Lo que sea: el tema, quién la dio, si hubo café… todo cuenta. Y pueden mandar varias cosas.'),
      ),
      during('Mientras llegan las respuestas',
        A('(Lee 3 o 4 respuestas con el nombre.) A ver… «Casi nada, la verdad». Gracias por la honestidad.'),
        J('Ahora levanten la mano los que recuerden tres ideas concretas. (Cuenta.) ¿Ven? Somos poquitos.'),
        A('Y ojo: no es que la capacitación haya sido mala, ni que ustedes tengan mala memoria.'),
        J('Así funciona el cerebro. Y justo eso es lo que vamos a ver.'),
      ),
    ],
    tip: 'Cada quien puede mandar varios comentarios y todos salen completos; si no caben, rotan solos en pantalla (carrusel). Alex puede ocultar los de alguien en su panel (Preguntas).',
  },
  memoria: {
    t: '7:30–9:00',
    beats: [enter(
      J('Para que algo se quede pasan tres cosas: primero te fijas, luego lo guardas y después lo recuerdas.'),
      A('¿Les ha pasado que se encuentran a alguien en el súper, saben perfecto quién es… y el nombre no sale?'),
      J('Pues el nombre sí está guardado. Lo que falla es el camino de regreso, que es el tercer paso.'),
      A('Si eso les pasó esta semana, mándenme un 🤯 desde el celular.'),
    )],
  },
  miller: {
    t: '9:00–10:30',
    beats: [
      enter(
        A('Aquí va un dato curioso: en 1956, George Miller descubrió que la memoria de corto plazo carga más o menos 7 cosas a la vez; entre 5 y 9, según la persona.'),
        J('Y estudios más recientes dicen que en realidad son todavía menos. A ver, voten en su celular: ¿alguna vez han entrado a un cuarto y se les olvidó a qué iban?'),
      ),
      click(1, 'aparecen los porcentajes',
        A('(Lee el resultado.) El 91% dice que sí… y el otro 9% seguramente no se acuerda.'),
        J('No es que anden distraídos: es que la mochila de 7 lugares ya venía llena.'),
      ),
    ],
    tip: 'La votación se abre al entrar; el clic solo muestra el resultado en pantalla.',
  },
  chunk: {
    t: '10:30–12:00',
    beats: [
      enter(
        J('Vamos con una prueba rápida. Les voy a mostrar un número durante cinco segundos. Nada de anotarlo.'),
        A('Ni en la mano, ¿eh? Los estoy viendo.'),
      ),
      click(1, 'sale el número con su cuenta regresiva y se borra solo',
        A('(Los dos en silencio mientras cuenta. Cuando se borra:) ¡Listo, se fue! Escríbanlo en su celular.'),
        J('Sin presión… solo está en juego su reputación.'),
        A('(Lee cuántos van contestando.)'),
      ),
    ],
    tip: 'Un clic durante la cuenta borra el número antes. El siguiente clic va a los resultados.',
  },
  'chunk-res': {
    t: '12:00–13:00',
    beats: [
      enter(J('A ver, ¿quién se lo supo?')),
      click(1, 'los que lo recordaron (suena el ta-dá)', A('(Lee los nombres.) ¡Un aplauso para ellos! Mándenles un 👏.')),
      click(2, 'los que no lo lograron (suena el trombón triste)', J('Y los que no… tranquilos, están en muy buena compañía.')),
      click(3, 'el número y el promedio de dígitos',
        A('El número era 5-5-1-8-2-7-4-3-9-0. En promedio le atinaron a (lee el número) de 10 dígitos.'),
        J('¿Les suena el 7? Es justo el límite del que hablaba Miller.'),
      ),
    ],
  },
  'chunk-truco': {
    t: '13:00–14:00',
    beats: [
      enter(J('Ahora les enseño el truco. Mismo número.')),
      click(1, 'el número se parte en 3 bloques',
        A('55, 1827, 4390. Cierren los ojos tres segundos y repítanlo.'),
        J('Mucho más fácil, ¿verdad? Pasamos de diez cosas a solo tres.'),
      ),
      click(2, 'la explicación',
        A('Por eso los teléfonos y las tarjetas vienen en bloques: agrupar es la forma de engañar al límite de 7.'),
        J('Y esa es la primera estrategia que se llevan: agrupar.'),
      ),
    ],
  },
  'ronda-2': {
    t: '14:00–14:15',
    beats: [enter(
      A('¡Ronda 2: el olvido!'),
      J('Les presento al villano de esta historia: el Olvido. Su trabajo es borrar lo que aprenden… y es buenísimo en lo que hace.'),
    )],
    tip: COVER_TIP,
  },
  adivina: {
    t: '14:15–15:30',
    beats: [
      enter(
        A('Pregunta para todos: si no lo vuelven a ver, ¿cuánto creen que olvidan en un solo día? Elijan A, B, C o D.'),
        J('Piénsenlo bien… aunque, siendo honestos, mañana ni se van a acordar de qué votaron.'),
      ),
      click(1, 'porcentajes y quién votó qué',
        A('(Lee los porcentajes y algunos nombres.) Muchos se fueron por la B… y hay unos cuantos pesimistas en la D.'),
      ),
      click(2, '«¡Era la C!» (se cierra la votación)',
        J('¡Era la C! Dos terceras partes en un solo día.'),
        A('Felicidades a (lee 2 o 3 nombres de la C). En su celular ya les dijo si le atinaron.'),
      ),
    ],
  },
  curva: {
    t: '15:30–17:00',
    beats: [
      enter(
        J('Esto lo midió Hermann Ebbinghaus en 1885: se aprendió listas de sílabas sin sentido y fue midiendo cuánto le quedaba.'),
        A('Sí, ese era su pasatiempo. Así se divertía la gente en 1885.'),
      ),
      click(1, '20 minutos: 58%', J('A los 20 minutos todavía recordaba el 58%.')),
      click(2, '1 hora: 44%', A('A la hora ya iba en 44%. O sea, menos de lo que dura una junta.')),
      click(3, '1 día: 34%', J('Al día siguiente, 34%.')),
      click(4, '1 mes: 21%', A('Y al mes, apenas el 21%.')),
      click(5, 'lo que te queda',
        A('En resumen: en un día se nos van casi dos terceras partes, y lo que más se pierde, se pierde en la primera hora.'),
        J('Y no crean que es cosa vieja: en 2015 repitieron el experimento y salió casi igual.'),
      ),
    ],
  },
  repaso: {
    t: '17:00–18:30',
    beats: [
      enter(A('Pero hay buenas noticias: al Olvido sí se le puede ganar. Así se ve la curva cuando no repasamos.')),
      click(1, 'aparecen los repasos',
        J('Y así se ve cuando sí repasamos: cada repaso sube el recuerdo otra vez… y cada vez se cae más despacio.'),
      ),
      click(2, 'la receta',
        A('La receta es sencilla: hoy, cinco minutos de repaso; en dos días, se lo explican a alguien; y en una semana, lo recuerdan sin ver.'),
        J('No se trata de estudiar más horas, sino de volver varias veces. Poquito, pero seguido.'),
      ),
    ],
  },
  'ronda-3': {
    t: '18:30–18:45',
    beats: [enter(
      J('¡Ronda 3: mitos!'),
      A('Aquí vamos a descubrir quién se cree todo lo que le llega por WhatsApp.'),
    )],
    tip: COVER_TIP,
  },
  mitos: {
    t: '18:45–19:15',
    beats: [enter(
      J('Les vamos a leer cuatro frases sobre cómo aprendemos. Dos son verdad y dos son mentira.'),
      A('Voten verdadero o falso en su celular. Y ojo, que aquí sí sale con nombre quién votó qué.'),
    )],
  },
  'mito-1': {
    t: '19:15–20:00',
    beats: [
      enter(
        J('Primera frase: «Releer mis apuntes es la mejor forma de estudiar».'),
        A('(Lee el marcador y algunos nombres de cada lado.) Va 15 a 8…'),
      ),
      click(1, '¡FALSO! (se cierra la votación)',
        J('¡Falso! Releer te da la sensación de que ya te lo sabes, pero no entrena el recordar.'),
        A('Es como ver videos de ejercicio: se siente bien, pero no te salen músculos.'),
      ),
    ],
    tip: 'La votación se abre al entrar. El clic revela, la cierra y cada celular dice si le atinó.',
  },
  'mito-2': {
    t: '20:00–20:45',
    beats: [
      enter(
        A('Segunda frase: «Dormir bien te ayuda a recordar lo que aprendiste».'),
        J('(Lee el marcador.) Aquí casi todos van por el mismo lado…'),
      ),
      click(1, '¡VERDADERO! (se cierra la votación)',
        A('¡Verdadero! Mientras duermes, tu cerebro repasa y acomoda lo que aprendiste en el día.'),
        J('O sea, la siesta ya es oficialmente parte de la capacitación. Mándenme un 😴.'),
      ),
    ],
  },
  'mito-3': {
    t: '20:45–21:30',
    beats: [
      enter(
        J('Tercera: «Aprendes mejor si te enseñan en tu estilo, visual o auditivo».'),
        A('(Lee algunos nombres de cada columna.) Esta siempre divide al grupo…'),
      ),
      click(1, '¡FALSO! (se cierra la votación)',
        J('¡Falso! No hay evidencia de que aprender en «tu estilo» te haga aprender más.'),
        A('A todos nos ayuda ver y escuchar. Así que, perdón, pero sí hay que leer los correos.'),
      ),
    ],
  },
  'mito-4': {
    t: '21:30–22:15',
    beats: [
      enter(
        A('Y la última: «Intentar recordar sin ver tus notas funciona mejor que releerlas».'),
        J('(Lee el marcador.) Esta va reñida…'),
      ),
      click(1, '¡VERDADERO! (se cierra la votación)',
        A('¡Verdadero! Sacar la información de tu cabeza es justo lo que la fortalece.'),
        J('¿Quién le atinó a las cuatro? Échense un 👏.'),
      ),
    ],
  },
  funciona: {
    t: '22:15–23:30',
    beats: [enter(
      J('Entonces, ¿qué sí funciona? Primero, recordar sin ver: antes de una llamada, intenten decir los tres puntos clave sin leerlos.'),
      A('Segundo, repasar espaciado: hoy, en dos días y en una semana. Poquito, pero varias veces.'),
      J('Tercero, explicárselo a alguien más: cuando enseñas, te obligas a ordenar lo que sabes.'),
      A('Y hay una cuarta, la más poderosa de todas.'),
      J('Pero esa no se las vamos a explicar…'),
      A('…se las vamos a demostrar.'),
    )],
  },
  'ronda-final': {
    t: '23:30–23:45',
    beats: [enter(
      A('¡Llegamos a la gran final!'),
      J('El reto de las 20 palabras. Dos intentos. Y ya saben lo que les dije al principio: casi nadie lo pasa a la primera.'),
    )],
    tip: COVER_TIP,
  },
  reto: {
    t: '23:45–24:15',
    beats: [
      enter(
        J('Pongan el celular boca abajo. Nada de chat ni de notas. Van a ver 20 palabras, cada una con su número y su dibujo.'),
        A('Cada una dura cinco segundos y avanzan solas. Joss y yo se las vamos a ir leyendo; ustedes nada más miren y escuchen.'),
        J('¿Listos? Ahí vamos.'),
      ),
      click(1, 'entra la palabra 1; desde ahí avanzan solas'),
    ],
    tip: 'Se turnan para leer: Joss las impares y Alex las pares. P (o el botón de Alex) pausa si algo pasa. Las reacciones se apagan mientras pasan las palabras.',
  },
  escribe: {
    t: '26:00–28:00',
    beats: [
      enter(
        J('Ahora sí, tomen su celular. Cuando dé clic se van a abrir 20 casillas.'),
        A('Escriban cada palabra en su número; si no se acuerdan de alguna, déjenla en blanco. Tienen dos minutos… y sí, los estamos viendo por la cámara.'),
      ),
      click(1, 'arranca el reloj de 2 minutos',
        A('(A la mitad.) Vamos a la mitad. (Lee cuántos ya enviaron.)'),
        J('(A los 30 segundos.) ¡Últimos 30 segundos!'),
        A('(En cero.) ¡Se acabó el tiempo! Celulares abajo.'),
      ),
    ],
    tip: 'En 0:00 los celulares se bloquean solos. Si todos terminan antes, la ronda se cierra sola. El siguiente clic va a resultados.',
  },
  resultados: {
    t: '28:00–29:00',
    beats: [enter(
      J('¿Cuántas sacaron? Ya tienen su puntaje en el celular, y aquí cada quien aparece en su rango, con su nombre.'),
      A('(Lee el promedio y el rango que se ilumina.) El grupo promedió…'),
      J('La mayoría quedó entre 0 y 10. Y eso es completamente normal: bienvenidos al club.'),
      A('(Si alguien quedó entre 16 y 20.) Y tenemos a alguien en «ven a dar tú la capacitación». (Nombre), el micrófono es tuyo.'),
    )],
  },
  serial: {
    t: '29:00–30:00',
    beats: [
      enter(
        A('Esta gráfica sale de sus propias respuestas: muestra qué tanto recordaron cada número.'),
        J('Fíjense: las primeras, bien; las últimas, bien… y un hoyo en medio. Se llama efecto de posición serial.'),
      ),
      click(1, '¿por qué?',
        A('Las primeras alcanzaron a repetirlas en su cabeza, y las últimas todavía estaban frescas en la memoria de corto plazo.'),
        J('Y las del medio no tuvieron ni una cosa ni la otra. Les dimos 20 cosas y su cerebro carga unas 7. Las cuentas no dan…'),
        A('…¿o sí?'),
      ),
    ],
  },
  revela: {
    t: '30:00–31:00',
    beats: [
      enter(
        J('Y aquí viene el giro de la historia: ¿por qué calcetines era el número 2? Escríbanlo en su celular.'),
        A('(Lee 2 o 3 respuestas con el nombre.)'),
      ),
      during('Si hay muchas respuestas', A('(Rotan solas en carrusel; lee las que vayan saliendo.) Pueden mandar más de una, ¿eh?')),
      click(1, 'aparece el sello «¡Son un par!»',
        J('¡Porque son un par! Nada de esto fue al azar.'),
        A('Cada palabra estaba colgada de su número. Vamos a ver el código completo.'),
      ),
    ],
  },
  'codigo-1': {
    t: '31:00–32:00',
    beats: [
      enter(
        J('Este es el código secreto. Antes de cada clic les preguntamos, y ustedes contestan en voz alta o en el chat.'),
        A('Y si nadie le atina, damos clic y hacemos como que era obvio.'),
      ),
      click(1, '1 · Sol: «Solo hay uno»', J('(Antes del clic.) ¿Por qué el sol es el 1?'), A('(Después.) ¡Porque solo hay uno!')),
      click(2, '2 · Calcetines: «Siempre van en par»', A('¿Y los calcetines, el 2?'), J('Porque siempre van en par.')),
      click(3, '3 · Semáforo: «Tres luces»', J('¿El semáforo?'), A('Tiene tres luces.')),
      click(4, '4 · Carro: «Cuatro llantas»', A('¿Y el carro, el 4?'), J('Cuatro llantas.')),
      click(5, '5 · Estrella: «Cinco picos»', J('¿Y la estrella?'), A('Cinco picos.')),
    ],
    tip: 'Ritmo: 10 a 15 segundos por palabra. Quien pregunta lo hace antes del clic; quien contesta, después.',
  },
  'codigo-2': {
    t: '32:00–33:00',
    beats: [
      click(1, '6 · Dado: «Seis caras»', A('¿Por qué el dado es el 6?'), J('Porque tiene seis caras.')),
      click(2, '7 · Arcoíris: «Siete colores»', J('¿Y el arcoíris?'), A('Siete colores. Luego los cuentan, eh.')),
      click(3, '8 · Infinito: «Un 8 acostado»', A('¿Y el infinito, el 8?'), J('Porque es un 8 acostado. Esa casi nadie la ve venir.')),
      click(4, '9 · Bebé: «Nueve meses de embarazo»', J('¿El bebé?'), A('Nueve meses.')),
      click(5, '10 · Manos: «Diez dedos»', A('¿Y las manos, el 10?'), J('Diez dedos.')),
    ],
  },
  'codigo-3': {
    t: '33:00–34:00',
    beats: [
      click(1, '11 · Windows: «Windows 11»', J('¿Por qué Windows es el 11?'), A('Por Windows 11, el que se actualiza justo cuando vas a presentar.')),
      click(2, '12 · Reloj: «Doce horas»', A('¿El reloj?'), J('Doce horas en la carátula.')),
      click(3, '13 · Martes: «Martes 13»', J('¿Y el martes, el 13?'), A('Martes 13, día de mala suerte.')),
      click(4, '14 · Corazón: «14 de febrero»', A('¿El corazón?'), J('14 de febrero.')),
      click(5, '15 · Vestido: «Fiesta de XV años»', J('¿Y el vestido, el 15?'), A('Fiesta de XV años, con todo y chambelanes.')),
    ],
    tip: 'Si van atrasados, digan la razón sin preguntar.',
  },
  'codigo-4': {
    t: '34:00–34:45',
    beats: [
      click(1, '16 · iPhone: «El iPhone 16»', A('¿Por qué el iPhone es el 16?'), J('Por el iPhone 16.')),
      click(2, '17 · Cohete: «Dieci-SIETE rima con co-HETE»', J('¿Y el cohete, el 17?'), A('Por la rima: dieci-SIETE, co-HETE. Así lo enseñaba John Sambrook en 1879.')),
      click(3, '18 · Credencial: «Mayoría de edad»', A('¿La credencial?'), J('Porque a los 18 ya puedes votar.')),
      click(4, '19 · Cubrebocas: «COVID-19»', J('¿El cubrebocas?'), A('COVID-19. Esa nadie la quiere recordar, pero ahí está.')),
      click(5, '20 · Pies y manos: «Veinte dedos»', A('¿Y pies y manos, el 20?'), J('Veinte dedos.')),
    ],
  },
  segunda: {
    t: '34:45–38:00',
    beats: [
      enter(
        A('Ahora que ya conocen el código, vamos otra vez. Pero esta vez se las pedimos en desorden.'),
        J('Usen el gancho de cada número. Tienen tres minutos.'),
      ),
      click(1, 'arranca el reloj de 3 minutos',
        A('(Mientras escriben.) Y no me vean a mí, que yo tampoco me acuerdo de la 13.'),
        J('(A los 30 segundos.) ¡Últimos 30 segundos!'),
        A('(En cero.) ¡Tiempo!'),
      ),
    ],
    tip: 'No digan ninguna palabra mientras corre el reloj. En 0:00 se cierra sola; el siguiente clic va al antes y después.',
  },
  comparativo: {
    t: '38:00–39:00',
    beats: [
      enter(J('Antes de conocer el código, el grupo recordó en promedio… (lee el número de la ronda 1).')),
      click(1, 'la ronda 2, con redoble', A('¡Y con el código…! (Lee el número.) Mismas personas, diez minutos después.')),
      click(2, 'la frase y la mayor mejora',
        J('Su memoria no cambió. Lo que cambió fue la forma de guardar.'),
        A('Y la mayor mejora es para… (lee el nombre y su antes y después). ¡Mándenle un 👏!'),
      ),
      click(3, 'su calificación del inicio',
        J('Al principio se calificaron con (lee el número) de 10. ¿Se subirían la calificación?'),
        A('Si sí, mándenme un 🧠.'),
      ),
    ],
  },
  podio: {
    t: '39:00–40:00',
    beats: [
      enter(A('Y llegamos a la tabla final: ronda 1 más ronda 2, máximo 40 puntos. ¿Quién se acordó de más?')),
      click(1, 'tercer lugar', J('En tercer lugar… (lee los nombres y los puntos).')),
      click(2, 'segundo lugar', A('En segundo lugar… (lee los nombres y los puntos).')),
      click(3, '¡primer lugar! (confeti y fanfarria)', J('Y el primer lugar es para… ¡(nombres)!'), A('¡Todos, mándenle un 👏!')),
      click(4, 'todos los demás, con sus puntos',
        A('(Lee algunos nombres de la lista.)'),
        J('Y todos los demás también ganaron: ya saben algo que el resto de la oficina no sabe.'),
      ),
    ],
    tip: 'Mismo puntaje, mismo lugar: los empatados suben juntos al escalón. Del 4.º lugar en adelante salen todos con sus puntos; si no caben, rotan solos.',
  },
  porque: {
    t: '40:00–41:30',
    beats: [enter(
      J('¿Y por qué funcionó? Primero, porque lo pueden imaginar: un semáforo se guarda como palabra y como imagen, así que hay dos caminos para encontrarlo.'),
      A('Segundo, porque se cuelga de algo que ya saben: ustedes ya sabían que un semáforo tiene tres luces, y solo le pegaron algo nuevo.'),
      A('Y tercero, porque tiene una dirección fija: el número les dice dónde buscar, aunque se los pidamos en desorden.'),
      J('Imagen, más algo que ya sabes, más un orden: así se forma una memoria que sí regresa.'),
    )],
  },
  'gancho-final': {
    t: '41:30–42:30',
    beats: [enter(
      J('Esta es la cuarta estrategia: asociar. Ustedes no tienen mala memoria…'),
      A('…tienen información sin gancho.'),
      J('Y no es algo que inventamos nosotros: en 1651, Henry Herdson ya enseñaba a ligar números con objetos.'),
      A('En 1879, John Sambrook lo hizo popular con rimas, como la del cohete. Y en 1968, Bugelski comprobó en laboratorio que imaginar la relación hace que se recuerde mucho más.'),
    )],
  },
  cierre: {
    t: '42:30–44:30',
    beats: [
      enter(
        J('Ahora les toca a ustedes: ¿qué les cuesta recordar o enseñar en su trabajo… y de qué lo podrían colgar?'),
        A('Escríbanlo en su celular y, si quieren, elijan su área. Pueden mandar varias ideas; y para destrabar, aquí van unos ejemplos.'),
      ),
      during('Ganchos por área (se turnan; lean solo los de las áreas que están conectadas)',
        ...AREA_HOOKS.map(([area, hook], i) => [i % 2 ? 'A' : 'J', `En ${area}: ${hook.charAt(0).toLowerCase()}${hook.slice(1)}`])),
    ],
    tip: 'La pregunta sigue abierta en el muro: las respuestas van apareciendo ahí. El gancho del área que elija cada quien sale en su PDF.',
  },
  muro: {
    t: '44:30–45:30',
    beats: [enter(
      A('Este es el muro del grupo. (Lee dos tarjetas de áreas distintas, con el nombre.)'),
      J('(Conecta una tarjeta con el gancho de su área.) ¿Ven? Lo de las fechas de cierre se puede colgar de la quincena.'),
      A('(Lee una tarjeta más.)'),
      J('Y esto es lo más valioso que se llevan hoy: no la teoría, sino su propio gancho.'),
    )],
  },
  llevar: {
    t: '45:30–46:30',
    beats: [enter(
      J('Para cerrar, se llevan cuatro ideas. Uno: su memoria de corto plazo es chiquita, así que agrupen.'),
      A('Dos: sin repaso, en un día se va casi todo; repasen espaciado.'),
      J('Tres: releer engaña; mejor recuerden sin ver.'),
      A('Y cuatro: lo que se cuelga de algo, se queda; asocien.'),
      J('Y en siete días les vamos a mandar un mensaje con una sola pregunta: ¿cuál era la 7?'),
      A('Si la recuerdan, ya saben por qué. Y si no… para eso está su PDF.'),
    )],
    tip: 'Seguimiento: una semana después, manden ese mensaje por el grupo de WhatsApp.',
  },
  resumen: {
    t: '46:30–47:30',
    beats: [enter(
      J('Y así jugamos hoy: aquí están todos, con su avatar y cómo les fue.'),
      A('En su celular ya pueden descargar su recuerdo en PDF: trae su nombre, su avatar, sus respuestas y una guía cortita para aplicar todo esto.'),
      J('Muchas gracias por jugar con nosotros, cerebros.'),
      A('¡Nos vemos en siete días… si se acuerdan!'),
    )],
    tip: 'Déjenla en pantalla mientras se despiden y reaccionan. El botón del PDF está en cada celular desde que cierra la segunda ronda.',
  },
};

// Las 20 palabras avanzan solas cada 5 s. Se turnan para leerlas: Joss las impares, Alex las pares.
const WORD_LINES = [
  'Uno: sol.', 'Dos: calcetines.', 'Tres: semáforo.', 'Cuatro: carro.', 'Cinco: estrella.',
  'Seis: dado.', 'Siete: arcoíris.', 'Ocho: infinito.', 'Nueve: bebé.', 'Diez: manos.',
  'Once: Windows.', 'Doce: reloj.', 'Trece: martes.', 'Catorce: corazón.', 'Quince: vestido.',
  'Dieciséis: iPhone.', 'Diecisiete: cohete.', 'Dieciocho: credencial.', 'Diecinueve: cubrebocas.', 'Veinte: pies y manos.',
];
WORD_LINES.forEach((line, i) => {
  const id = 'p' + String(i + 1).padStart(2, '0');
  const who = i % 2 ? 'A' : 'J';
  const next = WORD_LINES[i + 1];
  GUION[id] = {
    t: i === 0 ? '24:15–26:00' : '',
    beats: [
      enter([who, line]),
      ...(next ? [during('Avanza sola en 5 s; sigue', [who === 'J' ? 'A' : 'J', next])] : []),
    ],
    tip: next
      ? 'Lean solo el número y la palabra, sin explicar. No toquen nada: avanza sola.'
      : 'Aquí se detiene: el siguiente clic lleva a «Escribe del 1 al 20». P pausa y P sigue si algo pasa.',
  };
});

const NAMES = { J: 'JOSS', A: 'ALEX' };
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// HTML del guion de una diapositiva. me = 'J' o 'A': resalta las líneas de quien lo lee.
// click = clics que Joss ya dio en esta diapositiva (null si no se sabe): marca lo que ya
// pasó, lo que toca ahora y el próximo clic.
export function guionHtml(id, me = 'J', click = null) {
  const g = GUION[id];
  if (!g) return '';
  let level = 0;
  const beats = g.beats.map((b) => {
    if (b.click) level = b.click;
    const phase = click == null ? '' : level < click ? ' past' : level === click ? ' now' : b.click === click + 1 ? ' next' : '';
    return { b, phase };
  }).map(({ b, phase }) => `<div class="beat${phase}">
      <p class="cue${b.click ? ' click' : ''}">${b.click ? `CLIC ${b.click} · ` : ''}${esc(b.cue)}</p>
      ${b.lines.map(([w, text]) => `<div class="line ${w === 'J' ? 'joss' : 'alex'}${w === me ? ' mine' : ''}"><b>${w === me ? `TÚ (${NAMES[w]})` : NAMES[w]}</b>${esc(text)}</div>`).join('')}
    </div>`).join('');
  return `${g.t ? `<p class="cue time">⏱ ${esc(g.t)}</p>` : ''}${beats}${g.tip ? `<div class="line tip"><b>CÓMO FUNCIONA</b>${esc(g.tip)}</div>` : ''}`;
}

// Texto plano (respaldo de la ventana de notas).
export function guionText(id) {
  const g = GUION[id];
  if (!g) return '';
  const beats = g.beats.map((b) => [`[${b.click ? `CLIC ${b.click} · ` : ''}${b.cue}]`, ...b.lines.map(([w, t]) => `${NAMES[w]}: ${t}`)].join('\n'));
  return [g.t && `⏱ ${g.t}`, ...beats, g.tip && `👉 ${g.tip}`].filter(Boolean).join('\n\n');
}
