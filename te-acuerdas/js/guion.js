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
      J('¡Buenos días! Bienvenidos a «¿Te acuerdas?». Hoy no vienen a escuchar una plática: vienen a jugar.'),
      A('Y a perder un poquito, pero con dignidad. Al final hay un reto de 20 palabras y casi nadie lo pasa a la primera.'),
      J('Spoiler: esta capacitación sí la van a recordar. De eso se trata.'),
    )],
    tip: 'Compartan esta pestaña antes de que entre la gente. No digan la palabra «asociación» en toda la primera parte: la sorpresa sostiene la sesión.',
  },
  sala: {
    t: '1:00–3:00',
    beats: [
      enter(
        J('Saquen el celular y escaneen este código. Elijan su cerebro, su color y pongan su nombre.'),
        A('Si están en la compu, el link está en el chat. Y ojo: su nombre sale en pantalla, así que nada de apodos que no le puedan enseñar a su jefe.'),
      ),
      during('Mientras van entrando',
        A('(Lee 3 o 4 nombres que van cayendo.) ¡Bienvenida, Caro! ¡Llegó Luis!'),
        J('Abajo en su celular tienen seis reacciones con sonido. Pruébenlas ahorita.'),
        A('(Cuando suene alguna.) Ese «Zzz» tan temprano me preocupa.'),
      ),
    ],
    tip: 'Alex: «Copiar link para el chat» en su panel. Esperen a que el contador llegue a casi todos; quien llegue tarde también juega.',
  },
  despierta: {
    t: '3:00–4:30',
    beats: [
      enter(
        J('Yo soy Joss y llevo el juego.'),
        A('Y yo soy Alex: cuido el reloj, las respuestas y que nadie haga trampa.'),
        J('Primera pregunta, sin trampa: del 1 al 10, ¿qué tan buena es su memoria? Califíquenla en su celular.'),
      ),
      during('Mientras votan',
        A('(Lee el promedio en vivo.) Vamos en… ¡y alguien se puso un 10! Valiente. Te vamos a estar observando.'),
        J('Guárdense su número: al final se lo vamos a recordar.'),
        A('Si nos acordamos.'),
      ),
    ],
    tip: 'La votación se abre sola al entrar y se cierra al pasar a la siguiente.',
  },
  reglas: {
    t: '4:30–5:30',
    beats: [enter(
      J('Así se juega hoy: tres rondas cortas y una final.'),
      A('Ronda 1, su memoria. Ronda 2, el olvido. Ronda 3, mitos. Y la final: el reto de las 20 palabras.'),
      J('Tres reglas: cámara encendida, celular a la mano y conectados a la sala.'),
      A('Y una que no está escrita: el que se ríe del reto, lo pierde.'),
    )],
  },
  'ronda-1': {
    t: '5:30–5:45',
    beats: [enter(
      J('¡Ronda 1: tu memoria!'),
      A('Calentamos motores. Aquí no se estiran las piernas: se estira el cerebro.'),
    )],
    tip: COVER_TIP,
  },
  gancho: {
    t: '5:45–7:30',
    beats: [
      enter(
        J('Calentamiento: ¿qué recuerdan de la última capacitación que tomaron? Escríbanlo en su celular.'),
        A('Lo que sea: el tema, el instructor, el café… todo cuenta.'),
      ),
      during('Mientras llegan las respuestas',
        A('(Lee 3 o 4 burbujas con el nombre.) «Casi nada, la verdad»… gracias por tu honestidad.'),
        J('Ahora, que levante la mano quien recuerde tres ideas concretas. (Cuenta.) ¿Ven? Somos poquitos.'),
        A('Y no es que la capacitación fuera mala ni que ustedes tengan mala memoria. Así funciona el cerebro.'),
        J('Vamos a ver por qué.'),
      ),
    ],
    tip: 'Alex puede ocultar una respuesta en su panel (Preguntas) antes de que salga.',
  },
  memoria: {
    t: '7:30–9:00',
    beats: [enter(
      J('Para recordar algo pasan tres cosas: te fijas, lo guardas y lo recuerdas.'),
      A('¿Les ha pasado que ven a alguien en el súper, saben que lo conocen… y el nombre no sale?'),
      J('El nombre sí está guardado. Lo que falla es el camino de regreso: el tercer paso.'),
      A('Si les pasó esta semana, mándenme un 🤯.'),
    )],
  },
  miller: {
    t: '9:00–10:30',
    beats: [
      enter(
        A('Dato duro: George Miller, 1956. Su cerebro carga unas 7 cosas a la vez; entre 5 y 9, según la persona.'),
        J('Y estudios más recientes dicen que son todavía menos. Pregunta: ¿alguna vez entraron a un cuarto y olvidaron a qué iban? Voten sí o no.'),
      ),
      click(1, 'aparecen los porcentajes',
        A('(Lee el resultado.) El 91% dice que sí… y el 9% está mintiendo.'),
        J('No es que estén distraídos: se les llenó la mochila de 7 lugares.'),
      ),
    ],
    tip: 'La votación se abre al entrar; el clic solo muestra el resultado en pantalla.',
  },
  chunk: {
    t: '10:30–12:00',
    beats: [
      enter(
        J('Prueba rápida. Les voy a enseñar un número cinco segundos. No lo anoten.'),
        A('Ni en la mano. Los estoy viendo.'),
      ),
      click(1, 'sale el número con su cuenta regresiva y se borra solo',
        A('(Los dos callados mientras cuenta. Cuando se borra:) ¡Se fue! Ahora escríbanlo en su celular.'),
        J('Sin presión: solo está en juego su reputación.'),
        A('(Lee cuántos van contestando.)'),
      ),
    ],
    tip: 'Un clic durante la cuenta borra el número antes. El siguiente clic va a los resultados.',
  },
  'chunk-res': {
    t: '12:00–13:00',
    beats: [
      enter(J('¿Quién se lo supo?')),
      click(1, 'los que lo recordaron (suena el ta-dá)', A('(Lee los nombres.) ¡Mándenles un 👏!')),
      click(2, 'los que no lo lograron (suena el trombón triste)', J('Y estos… también son bienvenidos.')),
      click(3, 'el número y el promedio de dígitos',
        A('Era 5-5-1-8-2-7-4-3-9-0, dígito por dígito. En promedio le atinaron a (lee el número) de 10.'),
        J('¿Les suena el 7? Es justo el límite de Miller.'),
      ),
    ],
  },
  'chunk-truco': {
    t: '13:00–14:00',
    beats: [
      enter(J('Ahora el truco. Mismo número.')),
      click(1, 'el número se parte en 3 bloques',
        A('55, 1827, 4390. Cierren los ojos tres segundos y repítanlo.'),
        J('Más fácil, ¿verdad? Pasamos de 10 cosas a 3.'),
      ),
      click(2, 'la explicación',
        A('Así guardan los teléfonos sin darse cuenta: agrupar engaña al límite de 7.'),
        J('Primera estrategia para llevar: agrupa.'),
      ),
    ],
  },
  'ronda-2': {
    t: '14:00–14:15',
    beats: [enter(
      A('¡Ronda 2: el olvido!'),
      J('Les presento al villano de hoy: el Olvido. Su trabajo es borrar lo que aprenden. Y es muy bueno en su trabajo.'),
    )],
    tip: COVER_TIP,
  },
  adivina: {
    t: '14:15–15:30',
    beats: [
      enter(
        A('Si no lo vuelven a ver, ¿cuánto olvidan en un día? A, B, C o D en su celular.'),
        J('Piénsenlo con calma… o no, total, mañana ya no se acuerdan.'),
      ),
      click(1, 'porcentajes y quién votó qué',
        A('(Lee el marcador y algunos nombres.) Veo muchas B… y unos pesimistas en la D.'),
      ),
      click(2, '«¡Era la C!» (se cierra la votación)',
        J('¡Dos terceras partes en un solo día!'),
        A('Felicidades a (lee 2 o 3 nombres de la C). En su celular ya les dijo si le atinaron.'),
      ),
    ],
  },
  curva: {
    t: '15:30–17:00',
    beats: [
      enter(
        J('Esto lo midió Hermann Ebbinghaus en 1885: se memorizó listas de sílabas sin sentido y midió cuánto le quedaba.'),
        A('Sí, ese era su pasatiempo. Por algo es famoso.'),
      ),
      click(1, '20 minutos: 58%', J('A los 20 minutos le quedaba el 58%.')),
      click(2, '1 hora: 44%', A('A la hora, el 44%. Menos de lo que dura una junta.')),
      click(3, '1 día: 34%', J('Al día siguiente, el 34%.')),
      click(4, '1 mes: 21%', A('Y al mes, el 21%.')),
      click(5, 'lo que te queda',
        J('En un día se van casi dos terceras partes, y lo que más se pierde, se pierde en la primera hora.'),
        A('Y no es cosa de 1885: en 2015 Murre y Dros repitieron el experimento y salió casi igual.'),
      ),
    ],
  },
  repaso: {
    t: '17:00–18:30',
    beats: [
      enter(A('La buena noticia: al Olvido sí se le gana. Esta es la curva sin repasar.')),
      click(1, 'aparecen los repasos',
        J('Cada vez que repasan, el recuerdo regresa arriba… y la caída es cada vez más lenta.'),
      ),
      click(2, 'la receta',
        A('La receta: hoy, 5 minutos de repaso. En 2 días, explíquenselo a alguien. En una semana, recuérdenlo sin ver.'),
        J('No se trata de estudiar más horas, sino de volver varias veces. Poquito y seguido.'),
      ),
    ],
  },
  'ronda-3': {
    t: '18:30–18:45',
    beats: [enter(
      J('¡Ronda 3: mitos!'),
      A('Aquí vamos a descubrir quién cree todo lo que le llega por WhatsApp.'),
    )],
    tip: COVER_TIP,
  },
  mitos: {
    t: '18:45–19:15',
    beats: [enter(
      J('Cuatro frases sobre cómo aprendemos. Dos son verdad y dos son mentira.'),
      A('Voten verdadero o falso en su celular. Y ojo: aquí se ve con nombre quién votó qué.'),
    )],
  },
  'mito-1': {
    t: '19:15–20:00',
    beats: [
      enter(
        J('Mito 1: «Releer mis apuntes es la mejor forma de estudiar».'),
        A('(Lee el marcador y algunos nombres de cada lado.) Van 15 contra 8…'),
      ),
      click(1, '¡FALSO! (se cierra la votación)',
        J('¡Falso! Releer da la sensación de que ya te lo sabes, pero no entrena el recordar.'),
        A('Es como ver videos de gimnasio: se siente bien, pero no salen músculos.'),
      ),
    ],
    tip: 'La votación se abre al entrar. El clic revela, la cierra y cada celular dice si le atinó.',
  },
  'mito-2': {
    t: '20:00–20:45',
    beats: [
      enter(
        A('Mito 2: «Dormir bien te ayuda a recordar lo que aprendiste».'),
        J('(Lee el marcador.) Aquí casi todos van por el mismo lado…'),
      ),
      click(1, '¡VERDADERO! (se cierra la votación)',
        A('¡Verdadero! Mientras duermes, tu cerebro repasa y fija lo que aprendiste en el día.'),
        J('Pretexto oficial para la siesta. Mándenme un 😴.'),
      ),
    ],
  },
  'mito-3': {
    t: '20:45–21:30',
    beats: [
      enter(
        J('Mito 3: «Aprendes mejor si te enseñan en tu estilo: visual o auditivo».'),
        A('(Lee nombres de cada columna.) Este siempre divide al grupo…'),
      ),
      click(1, '¡FALSO! (se cierra la votación)',
        J('¡Falso! No hay evidencia de que aprender en «tu estilo» te haga aprender más.'),
        A('A todos nos ayuda ver y escuchar. Así que perdón, pero sí hay que leer los correos.'),
      ),
    ],
  },
  'mito-4': {
    t: '21:30–22:15',
    beats: [
      enter(
        A('Último: «Intentar recordar sin ver tus notas funciona mejor que releerlas».'),
        J('(Lee el marcador.) Este va reñido…'),
      ),
      click(1, '¡VERDADERO! (se cierra la votación)',
        A('¡Verdadero! Sacar la información de tu cabeza es lo que la fortalece.'),
        J('¿Quién tuvo los cuatro? Échense un 👏.'),
      ),
    ],
  },
  funciona: {
    t: '22:15–23:30',
    beats: [enter(
      J('Entonces, lo que sí funciona. Recordar sin ver: antes de una llamada, digan los tres puntos clave sin leerlos.'),
      A('Repasar espaciado: hoy, en dos días y en una semana. Poquito, pero varias veces.'),
      J('Y explicarle a otro: enseñar te obliga a ordenar lo que sabes.'),
      A('Hay una cuarta. La más poderosa de todas.'),
      J('Pero esa no se las vamos a explicar…'),
      A('…se las vamos a demostrar.'),
    )],
  },
  'ronda-final': {
    t: '23:30–23:45',
    beats: [enter(
      A('¡Llegó la final!'),
      J('El reto de las 20 palabras. Dos intentos. Y ya se los dije: casi nadie lo pasa a la primera.'),
    )],
    tip: COVER_TIP,
  },
  reto: {
    t: '23:45–24:15',
    beats: [
      enter(
        J('Celular boca abajo. Nada de chat ni de notas. Van a ver 20 palabras, cada una con su número y su dibujo.'),
        A('Cinco segundos cada una y avanzan solas. Se las leemos entre los dos: ustedes solo miren y escuchen.'),
        J('¿Listos?'),
      ),
      click(1, 'entra la palabra 1; desde ahí avanzan solas'),
    ],
    tip: 'Se turnan para leer: Joss las impares y Alex las pares. P (o el botón de Alex) pausa si algo pasa. Las reacciones se apagan mientras pasan las palabras.',
  },
  escribe: {
    t: '26:00–28:00',
    beats: [
      enter(
        J('Agarren su celular. En cuanto dé clic se abren 20 casillas: escriban cada palabra en su número. Si no recuerdan alguna, déjenla vacía.'),
        A('Tienen dos minutos. Y sí, los estamos viendo por la cámara.'),
      ),
      click(1, 'arranca el reloj de 2 minutos',
        A('(A la mitad.) Va la mitad. (Lee cuántos ya enviaron.)'),
        J('(A los 30 s.) ¡Quedan 30 segundos!'),
        A('(En cero.) ¡Tiempo! Celulares abajo.'),
      ),
    ],
    tip: 'En 0:00 los celulares se bloquean solos. Si todos terminan antes, la ronda se cierra sola. El siguiente clic va a resultados.',
  },
  resultados: {
    t: '28:00–29:00',
    beats: [enter(
      J('¿Cuántas sacaron? Su puntaje ya está en su celular, y aquí cada quien está en su rango, con su nombre.'),
      A('(Lee el promedio y el rango que se ilumina.) El grupo promedió…'),
      J('Casi todos entre 0 y 10. Es lo normal: bienvenidos al club.'),
      A('(Si hay alguien en 16–20.) Y tenemos a alguien en «ven a dar tú la capacitación». (Nombre), el micrófono es tuyo.'),
    )],
  },
  serial: {
    t: '29:00–30:00',
    beats: [
      enter(
        A('Esta gráfica sale de sus respuestas: qué tanto recordaron cada número.'),
        J('Bien las primeras, bien las últimas… y un hoyo en medio. Se llama efecto de posición serial.'),
      ),
      click(1, '¿por qué?',
        A('Las primeras las alcanzaron a repetir en su cabeza. Las últimas siguen frescas en la memoria de corto plazo.'),
        J('Y las del medio no tuvieron ni una cosa ni la otra. Les dimos 20 cosas y su cerebro carga unas 7. Las cuentas no dan…'),
        A('…¿o sí?'),
      ),
    ],
  },
  revela: {
    t: '30:00–31:00',
    beats: [
      enter(
        J('Giro de trama: ¿por qué calcetines era el 2? Escríbanlo en su celular.'),
        A('(Lee 2 o 3 burbujas con el nombre.)'),
      ),
      click(1, 'aparece el sello «¡Son un par!»',
        J('¡Porque son un par! Nada era al azar.'),
        A('Cada palabra estaba colgada de su número. Vamos a ver el código completo.'),
      ),
    ],
  },
  'codigo-1': {
    t: '31:00–32:00',
    beats: [
      enter(
        J('El código secreto. Antes de cada clic preguntamos; contesten en voz alta o en el chat.'),
        A('Y si nadie sabe, damos clic y hacemos como que era obvio.'),
      ),
      click(1, '1 · Sol: «Solo hay uno»', J('(Antes del clic.) ¿Por qué el sol es el 1?'), A('(Después.) ¡Solo hay uno!')),
      click(2, '2 · Calcetines: «Siempre van en par»', A('¿Y los calcetines el 2?'), J('Siempre van en par.')),
      click(3, '3 · Semáforo: «Tres luces»', J('¿El semáforo?'), A('Tres luces.')),
      click(4, '4 · Carro: «Cuatro llantas»', A('¿El carro el 4?'), J('Cuatro llantas.')),
      click(5, '5 · Estrella: «Cinco picos»', J('¿Y la estrella?'), A('Cinco picos.')),
    ],
    tip: 'Ritmo: 10 a 15 segundos por palabra. Quien pregunta lo hace antes del clic; quien contesta, después.',
  },
  'codigo-2': {
    t: '32:00–33:00',
    beats: [
      click(1, '6 · Dado: «Seis caras»', A('¿Por qué el dado es el 6?'), J('Seis caras.')),
      click(2, '7 · Arcoíris: «Siete colores»', J('¿Y el arcoíris?'), A('Siete colores. Al rato los cuentan.')),
      click(3, '8 · Infinito: «Un 8 acostado»', A('¿Y el infinito el 8?'), J('Es un 8 acostado. Ese casi nadie lo ve venir.')),
      click(4, '9 · Bebé: «Nueve meses de embarazo»', J('¿El bebé?'), A('Nueve meses.')),
      click(5, '10 · Manos: «Diez dedos»', A('¿Y las manos el 10?'), J('Diez dedos.')),
    ],
  },
  'codigo-3': {
    t: '33:00–34:00',
    beats: [
      click(1, '11 · Windows: «Windows 11»', J('¿Por qué Windows es el 11?'), A('Windows 11. El que se actualiza justo cuando vas a presentar.')),
      click(2, '12 · Reloj: «Doce horas»', A('¿El reloj?'), J('Doce horas en la carátula.')),
      click(3, '13 · Martes: «Martes 13»', J('¿Y el martes el 13?'), A('Martes 13, día de mala suerte.')),
      click(4, '14 · Corazón: «14 de febrero»', A('¿El corazón?'), J('14 de febrero.')),
      click(5, '15 · Vestido: «Fiesta de XV años»', J('¿Y el vestido el 15?'), A('Fiesta de XV años. Chambelanes incluidos.')),
    ],
    tip: 'Si van atrasados, digan la razón sin preguntar.',
  },
  'codigo-4': {
    t: '34:00–34:45',
    beats: [
      click(1, '16 · iPhone: «El iPhone 16»', A('¿Por qué el iPhone es el 16?'), J('El iPhone 16.')),
      click(2, '17 · Cohete: «Dieci-SIETE rima con co-HETE»', J('¿Y el cohete el 17?'), A('Por la rima: dieci-SIETE, co-HETE. Así lo enseñaba John Sambrook en 1879.')),
      click(3, '18 · Credencial: «Mayoría de edad»', A('¿La credencial?'), J('A los 18 ya votas.')),
      click(4, '19 · Cubrebocas: «COVID-19»', J('¿El cubrebocas?'), A('COVID-19. Ese nadie lo quiere recordar, pero ahí está.')),
      click(5, '20 · Pies y manos: «Veinte dedos»', A('¿Y pies y manos el 20?'), J('Veinte dedos.')),
    ],
  },
  segunda: {
    t: '34:45–38:00',
    beats: [
      enter(
        A('Ahora que conocen el código, vamos otra vez. Pero esta vez se las pedimos en desorden.'),
        J('Usen el gancho de cada número. Tienen tres minutos.'),
      ),
      click(1, 'arranca el reloj de 3 minutos',
        A('(Mientras escriben.) Ni me vean a mí: yo tampoco me acuerdo de la 13.'),
        J('(A los 30 s.) ¡Quedan 30 segundos!'),
        A('(En cero.) ¡Tiempo!'),
      ),
    ],
    tip: 'No digan ninguna palabra mientras corre el reloj. En 0:00 se cierra sola; el siguiente clic va al antes y después.',
  },
  comparativo: {
    t: '38:00–39:00',
    beats: [
      enter(J('Antes del código, el grupo recordó en promedio… (lee el número de la ronda 1).')),
      click(1, 'la ronda 2, con redoble', A('¡Y con el código…! (Lee el número.) Mismas cabezas, diez minutos después.')),
      click(2, 'la frase y la mayor mejora',
        J('Su memoria no cambió. Cambió la forma de guardar.'),
        A('Y la mayor mejora es para… (lee el nombre y su antes → después). ¡Mándenle un 👏!'),
      ),
      click(3, 'su calificación del inicio',
        J('Al inicio se calificaron con (lee el número) de 10. ¿Se subirían la calificación?'),
        A('Si sí, mándenme un 🧠.'),
      ),
    ],
  },
  podio: {
    t: '39:00–40:00',
    beats: [
      enter(A('La tabla final: ronda 1 más ronda 2, máximo 40 puntos. ¿Quién se acordó de más?')),
      click(1, 'tercer lugar', J('En tercer lugar… (lee nombre y puntos).')),
      click(2, 'segundo lugar', A('En segundo lugar… (lee nombre y puntos).')),
      click(3, '¡primer lugar! (confeti y fanfarria)', J('Y el primer lugar es para… ¡(nombre)!'), A('¡Todos, mándenle 👏!')),
      click(4, 'del 4.º al 10.º',
        A('(Lee los nombres.)'),
        J('Ustedes también ganaron: ya saben algo que el resto de la oficina no.'),
      ),
    ],
  },
  porque: {
    t: '40:00–41:30',
    beats: [enter(
      J('¿Por qué funcionó? Uno: lo pueden imaginar. Un semáforo se guarda como palabra y como imagen: dos caminos para encontrarlo.'),
      A('Dos: se cuelga de algo que ya saben. Ya sabían que el semáforo tiene tres luces; solo le pegaron algo nuevo.'),
      J('Y tres: tiene una dirección fija. El número les dice dónde buscar, aunque se los pidamos salteado.'),
      A('Imagen, más algo que ya sabes, más un orden: memoria que sí regresa.'),
    )],
  },
  'gancho-final': {
    t: '41:30–42:30',
    beats: [enter(
      J('Esta es la cuarta estrategia: asociar. No tienen mala memoria…'),
      A('…tienen información sin gancho.'),
      J('Y no la inventamos nosotros: en 1651 Henry Herdson ya enseñaba a ligar números con objetos.'),
      A('En 1879 John Sambrook la hizo popular con rimas, como el cohete. Y en 1968 Bugelski la probó en laboratorio: con imágenes se recuerda más.'),
    )],
  },
  cierre: {
    t: '42:30–44:30',
    beats: [
      enter(
        J('Su turno: ¿qué les cuesta recordar o enseñar en su trabajo… y de qué lo podrían colgar? Escríbanlo en su celular y elijan su área.'),
        A('Les damos ideas para destrabar.'),
      ),
      during('Ganchos por área (se turnan; lean solo los de las áreas que están conectadas)',
        ...AREA_HOOKS.map(([area, hook], i) => [i % 2 ? 'A' : 'J', `${area}: ${hook}`])),
    ],
    tip: 'La pregunta sigue abierta en el muro: las respuestas van apareciendo ahí. El gancho del área que elija cada quien sale en su PDF.',
  },
  muro: {
    t: '44:30–45:30',
    beats: [enter(
      A('Este es el muro del grupo. (Lee 2 tarjetas de áreas distintas, con el nombre.)'),
      J('(Conecta una tarjeta con el gancho de su área.) ¿Ven? Lo de las fechas de cierre se cuelga de la quincena.'),
      A('(Lee una tarjeta más.)'),
      J('Esto es lo que se llevan: no la teoría, su propio gancho.'),
    )],
  },
  llevar: {
    t: '45:30–46:30',
    beats: [enter(
      J('Para llevar, cuatro cosas. Uno: su memoria de corto plazo es chiquita: agrupen.'),
      A('Dos: sin repaso, en un día se va casi todo: repasen espaciado.'),
      J('Tres: releer engaña: recuerden sin ver.'),
      A('Y cuatro: lo que se cuelga de algo, se queda: asocien.'),
      J('En 7 días les vamos a mandar un mensaje con una sola pregunta: ¿cuál era la 7?'),
      A('Si la recuerdan, ya saben por qué. Y si no… para eso está el PDF.'),
    )],
    tip: 'Seguimiento: una semana después, manden ese mensaje por el grupo de WhatsApp.',
  },
  resumen: {
    t: '46:30–47:30',
    beats: [enter(
      J('Así jugamos hoy: aquí están todos, con su avatar y cómo les fue.'),
      A('En su celular ya pueden descargar su recuerdo en PDF: su nombre, su avatar, sus respuestas y una guía corta para usar todo esto.'),
      J('Gracias por jugar, cerebros.'),
      A('¡Nos vemos en 7 días… si se acuerdan!'),
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
