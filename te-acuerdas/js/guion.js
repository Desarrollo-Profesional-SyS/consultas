// Guion de los conductores, diapositiva por diapositiva. Se ve en la ventana de
// notas de Joss (tecla N) y en el panel de Alex; nunca en la pantalla compartida.
// t = minuto aproximado · joss / alex = lo que dice cada quien · tip = indicación técnica.

const WORD_LINES = [
  'Uno: sol.', 'Dos: calcetines.', 'Tres: semáforo.', 'Cuatro: carro.', 'Cinco: estrella.',
  'Seis: dado.', 'Siete: arcoíris.', 'Ocho: infinito.', 'Nueve: bebé.', 'Diez: manos.',
  'Once: Windows.', 'Doce: reloj.', 'Trece: martes.', 'Catorce: corazón.', 'Quince: vestido.',
  'Dieciséis: iPhone.', 'Diecisiete: cohete.', 'Dieciocho: credencial.', 'Diecinueve: cubrebocas.', 'Veinte: pies y manos.',
];

// Ganchos para recordar, por área (para el cierre y el muro).
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

const hooks = (areas) => AREA_HOOKS.filter(([a]) => areas.includes(a)).map(([a, h]) => `• ${a}: ${h}`).join('\n');

export const GUION = {
  cover: {
    t: '0:00–1:00',
    joss: '¡Buenos días! Hoy no vienen a escuchar una plática: vienen a jugar. Al final les vamos a poner un reto de memoria y les adelanto algo: casi nadie lo pasa a la primera.',
    alex: 'Y les presento a Memo. Memo es su cerebro. Hoy lo vamos a poner a prueba.',
    tip: 'Comparte esta pestaña antes de que entre la gente. No digan la palabra «asociación» en toda la primera parte: la sorpresa sostiene la sesión.',
  },
  sala: {
    t: '1:00–3:00',
    joss: 'Antes de arrancar, saquen el celular y escaneen este código. Elijan su cerebro, su color y pongan su nombre. Desde aquí todo se contesta en el celular.',
    alex: 'Si estás en la compu, te dejo el link en el chat. ¡Ya van entrando! (Lee algunos nombres que caen en pantalla.) Abajo en su celular tienen reacciones: úsenlas cuando algo les dé risa o les explote la cabeza. ¡Pruébenlas ahorita!',
    tip: 'Alex: «Copiar link para el chat» en su panel. Esperen a que el contador llegue a casi todos; quien llegue tarde también juega.',
  },
  despierta: {
    t: '3:00–4:30',
    joss: 'Yo soy Joss y voy a llevar el juego. Primera pregunta, sin trampa: del 1 al 10, ¿qué tan buena creen que es su memoria? Califíquenla en su celular.',
    alex: 'Yo soy Alex: cuido el reloj, las respuestas y los puntos. (Lee el promedio en vivo.) Vamos en… ¡alguien se puso un 10, valiente! Guárdense ese número: al final lo volvemos a ver.',
    tip: 'La votación se abre sola al entrar y se cierra al pasar a la siguiente.',
  },
  reglas: {
    t: '4:30–5:30',
    joss: 'Van a ser tres rondas cortas y un reto final. En cada una les vamos a pedir que voten o escriban en su celular.',
    alex: 'Tres reglas: cámara encendida, celular a la mano y conectados a la sala. (Joss señala la tarjeta rosa.) Esta es la que importa. Guárdense las ganas.',
  },
  gancho: {
    t: '5:30–7:30',
    joss: '¿Qué recuerdan de la última capacitación que tomaron? Escríbanlo en su celular. (Deja que el silencio trabaje.)',
    alex: '(Lee 3 o 4 burbujas con el nombre de quien la escribió.) Ahora, quien recuerde al menos TRES ideas concretas, levante la mano frente a la cámara.',
    tip: 'Cierre de Joss: «No es que la capacitación fuera mala ni que ustedes tengan mala memoria. Así funciona el cerebro. Memo está igual de mareado. Vamos a ver por qué.» Alex puede ocultar una respuesta en su panel (Preguntas) antes de que salga.',
  },
  memoria: {
    t: '7:30–9:00',
    joss: 'Para recordar algo pasan tres cosas: te fijas, lo guardas y lo recuerdas. ¿Les ha pasado que ven a alguien en el súper, saben que lo conocen y el nombre no sale? El nombre está guardado; lo que falla es encontrar el camino de regreso.',
    alex: '¿A quién le pasó esta semana? Mándenme un 🤯 en su celular.',
  },
  miller: {
    t: '9:00–10:30',
    joss: 'Su cerebro carga unas 7 cosas a la vez: George Miller lo encontró en 1956, entre 5 y 9. (Clic.) ¿Alguna vez entraron a un cuarto y olvidaron a qué iban? Voten sí o no.',
    alex: '(Lee el resultado.) El 91% dice que sí… y el 9% está mintiendo.',
    tip: 'El primer clic muestra la votación en pantalla. Remate de Joss: «No es que estén distraídos: se llenó la mochila de 7 lugares.»',
  },
  chunk: {
    t: '10:30–12:00',
    joss: 'Prueba rápida. Les voy a enseñar un número 5 segundos. No lo anoten. (Clic: el número sale con su cuenta regresiva y se borra solo.)',
    alex: '¡Se fue! Ahora escríbanlo en su celular. (Lee cuántos van contestando.)',
    tip: 'El campo para escribir se abre en los celulares en cuanto el número se borra.',
  },
  'chunk-res': {
    t: '12:00–13:00',
    joss: '(Clic.) Estos sí se lo supieron… (Clic.) Y estos no. (Clic.) El número era 5518274390.',
    alex: '(Lee los nombres de quienes lo lograron.) En promedio le atinaron a casi 7 de 10 dígitos. ¿Les suena el 7? Es justo el límite de Miller.',
  },
  'chunk-truco': {
    t: '13:00–14:00',
    joss: '(Clic.) Mismo número, pero en tres bloques: 55, 1827, 4390. Cierren los ojos tres segundos y repítanlo.',
    alex: 'Por eso los teléfonos y las tarjetas vienen en bloques. Agrupar engaña al límite de 7.',
  },
  adivina: {
    t: '14:00–15:30',
    joss: 'Les presento al Olvido. Su trabajo es borrar lo que aprenden. Si no lo vuelven a ver, ¿cuánto olvidan en un día? A, B, C o D en su celular.',
    alex: 'Tienen 10 segundos. (Clic 1: porcentajes y quién votó qué.) Veo muchas B…',
    tip: 'Clic 2: «¡Era la C! Dos terceras partes en un día.» Ese clic cierra la votación y cada celular dice si le atinó. Feliciten por nombre a los que le atinaron.',
  },
  curva: {
    t: '15:30–17:00',
    joss: 'Hermann Ebbinghaus, en 1885, se memorizó listas y midió cuánto le quedaba. (Un clic por barra.) A los 20 minutos, 58%… a la hora, 44%… al día, 34%… al mes, 21%.',
    alex: 'Y en 2015 repitieron el experimento y salió casi igual. La buena noticia: al Olvido se le puede ganar.',
  },
  repaso: {
    t: '17:00–18:30',
    joss: '(Clic.) Cada vez que repasan, el recuerdo regresa arriba… y la caída es cada vez más lenta.',
    alex: '(Clic: la receta.) No se trata de estudiar más horas, sino de volver varias veces: hoy, en dos días y en una semana.',
  },
  mitos: {
    t: '18:30–19:00',
    joss: 'Ronda 3: mitos. Cuatro frases sobre cómo aprendemos. Dos son verdad y dos son mentira.',
    alex: 'Voten verdadero o falso en su celular. Ojo: aquí se ve con nombre quién le atina.',
  },
  'mito-1': {
    t: '19:00–19:45',
    joss: '«Releer mis apuntes es la mejor forma de estudiar.» (Clic para revelar.) ¡FALSO! Da la sensación de que ya te lo sabes, pero no entrena el recordar.',
    alex: '(Antes del clic, lee el marcador y algunos nombres de cada lado.) Van 15 contra 8…',
    tip: 'El clic que revela cierra la votación y cada celular dice si le atinó.',
  },
  'mito-2': {
    t: '19:45–20:30',
    joss: '«Dormir bien te ayuda a recordar lo que aprendiste.» (Clic.) ¡VERDADERO! Mientras duermes, tu cerebro repasa y fija lo del día.',
    alex: 'Pretexto oficial para la siesta. Mándenme un 😴.',
  },
  'mito-3': {
    t: '20:30–21:15',
    joss: '«Aprendes mejor si te enseñan en tu estilo: visual o auditivo.» (Clic.) ¡FALSO! No hay evidencia de que aprender en «tu estilo» te haga aprender más. A todos nos ayuda ver Y escuchar.',
    alex: 'Este siempre divide al grupo… (lee nombres de cada columna).',
  },
  'mito-4': {
    t: '21:15–22:00',
    joss: '«Intentar recordar sin ver tus notas funciona mejor que releerlas.» (Clic.) ¡VERDADERO! Sacar la información de tu cabeza es lo que la fortalece.',
    alex: '¿Quién tuvo las 4? Échense un 👏.',
  },
  funciona: {
    t: '22:00–23:30',
    joss: 'Lo que sí funciona: recordar sin ver (antes de una llamada, di los 3 beneficios del curso sin leerlos); repasar espaciado (el proceso nuevo hoy, el miércoles y el lunes); y explicarle a otro (quien enseña aprende doble).',
    alex: '(Con pausa dramática.) Hay una cuarta. Es la más poderosa de todas. Pero no se las vamos a explicar… se las vamos a demostrar.',
  },
  reto: {
    t: '23:30–24:00',
    joss: 'Llegó el reto. Celular boca abajo, nada de chat ni de notas. Van a ver 20 palabras, cada una con su número y su dibujo. Cinco segundos cada una y avanzan solas.',
    alex: 'Yo se las voy a leer. Solo miren y escuchen.',
    tip: 'Un clic aquí entra a la palabra 1 y desde ahí corren solas cada 5 s. P (o el botón de Alex) pausa si algo pasa. Las reacciones se apagan mientras pasan las palabras.',
  },
  escribe: {
    t: '25:45–28:00',
    joss: 'Agarren su celular. En cuanto dé clic se abren 20 casillas: escriban cada palabra en su número. Si no recuerdan alguna, déjenla vacía. (Clic: arranca el reloj de 2 minutos.)',
    alex: '(A los 30 segundos.) ¡Quedan 30 segundos! (Al llegar a cero.) Celulares abajo.',
    tip: 'Al llegar a 0:00 los celulares se bloquean solos. Si todos terminan antes, la ronda se cierra sola. El siguiente clic va a resultados.',
  },
  resultados: {
    t: '28:00–29:00',
    joss: '¿Cuántas sacaron? Ya está su puntaje en su celular, y aquí cada quien está en su rango con su nombre.',
    alex: '(Lee el promedio y el rango con más gente, el que se ilumina, y algunos nombres.) Casi todos entre 0 y 10. Es lo normal.',
  },
  serial: {
    t: '29:00–30:00',
    joss: 'Esta es la gráfica real de este grupo: recordamos bien las primeras y las últimas… y hay un hoyo en medio. Se llama efecto de posición serial.',
    alex: '(Clic: la explicación.) Les dimos 20 cosas y su cerebro aguanta unas 7. Las cuentas no dan… ¿o sí?',
  },
  revela: {
    t: '30:00–31:00',
    joss: '¿Por qué calcetines era el 2? Escríbanlo en su celular.',
    alex: '(Lee burbujas con nombre; cuando alguien atine.) ¡Porque son un par! Punto para…',
    tip: 'Clic: aparece el sello. Joss: «Las palabras nunca fueron al azar. Cada una estaba colgada de su número. Vamos a ver el código completo.»',
  },
  'codigo-1': {
    t: '31:00–32:00',
    joss: 'Antes de cada clic: ¿por qué el sol era el 1? ¿Y el semáforo el 3? (Clic: aparece la razón.)',
    alex: '¡Eso! (Di el nombre de quien lo adivinó, en voz alta o en el chat.) ¿Y el 4? Cuatro llantas: carro.',
    tip: 'Ritmo: 10 a 15 segundos por palabra.',
  },
  'codigo-2': {
    t: '32:00–33:00',
    joss: '¿Por qué el dado era el 6? ¿Y el infinito el 8? (Clic por palabra.)',
    alex: 'El 8 acostado es el infinito: ese casi nadie lo ve venir.',
  },
  'codigo-3': {
    t: '33:00–34:00',
    joss: '¿Por qué Windows era el 11? ¿Y el corazón el 14? (Clic por palabra.)',
    alex: '¿Y el 13? Martes 13, día de mala suerte: esa la recuerda todo mundo.',
    tip: 'Si van atrasados, den dos clics seguidos sin preguntar.',
  },
  'codigo-4': {
    t: '34:00–34:30',
    joss: '¿Por qué el iPhone era el 16? (Clic.) Y el 17 es rima: dieci-SIETE, co-HETE. Así lo enseñaba John Sambrook en 1879.',
    alex: 'La 18 es la credencial: mayoría de edad para votar. Y la 20, veinte dedos: pies y manos.',
  },
  segunda: {
    t: '34:30–38:00',
    joss: 'Ahora que conocen el código, vamos otra vez. Pero esta vez se las vamos a pedir en desorden. (Clic: arranca el reloj de 3 minutos.)',
    alex: 'Mientras escriben: ¿cuál era la 14? ¡Exacto, corazón! (Avisa cuando falten 30 segundos.)',
  },
  comparativo: {
    t: '38:00–39:00',
    joss: 'Antes del código, en promedio recordaron esto… (Clic: ronda 2, con redoble.)',
    alex: 'Hace diez minutos sacaron muy poquito. Ahora se las saben hasta en desorden. (Clic.) Su memoria no cambió. Cambió la forma de guardar. ¡Y la mayor mejora es para…! (Clic.) Al inicio se calificaron con este número. ¿Se subirían la calificación? Mándenme un 🧠.',
  },
  podio: {
    t: '39:00–40:00',
    joss: '(Clic: tercer lugar. Clic: segundo. Clic: ¡primer lugar!, con confeti. Clic: del 4.º al 10.º.)',
    alex: 'Lee los nombres con emoción y pide aplausos: ¡denle 👏 desde su celular!',
  },
  porque: {
    t: '40:00–41:30',
    joss: '¿Por qué funcionó? Lo pueden imaginar: un semáforo se guarda como palabra y como imagen. Se cuelga de algo que ya saben: tres luces. Y tiene una dirección fija: el número les dice dónde buscar.',
    alex: 'Imagen + algo que ya sabes + un orden = memoria que sí regresa.',
  },
  'gancho-final': {
    t: '41:30–42:30',
    joss: 'No tienen mala memoria. Tienen información sin gancho.',
    alex: 'Esta técnica tiene casi 400 años: en 1651 Henry Herdson enseñaba a ligar números con objetos; en 1879 Sambrook la hizo popular con rimas, como el cohete; y en 1968 Bugelski comprobó en laboratorio que imaginar la relación hace que se recuerde mucho más.',
  },
  cierre: {
    t: '42:30–44:30',
    joss: `Su turno: ¿qué les cuesta recordar o enseñar en su trabajo… y de qué lo podrían colgar? Escríbanlo en su celular y elijan su área. Unos ejemplos para destrabar:\n${hooks(['Eje Cursos', 'Recursos Humanos', 'Sistemas', 'Publicidad'])}`,
    alex: `Si nadie escribe, leo el ejemplo de su área:\n${hooks(['Administración', 'Eje Empresas', 'Diseño', 'Ejecutiva Directiva'])}`,
    tip: 'La pregunta sigue abierta en el muro: las respuestas van apareciendo ahí.',
  },
  muro: {
    t: '44:30–45:30',
    joss: 'Este es el muro del grupo. (Conecta 2 o 3 tarjetas con el ejemplo de su área: «¿Ven? Lo de las fechas de cierre se cuelga de la quincena».)',
    alex: '(Lee 3 o 4 tarjetas de áreas distintas, con el nombre de quien la escribió.)',
  },
  llevar: {
    t: '45:30–46:30',
    joss: 'Para llevar: su memoria de corto plazo es chiquita, agrupen. Sin repaso, en un día se va casi todo: repasen espaciado. Releer engaña: recuerden sin ver. Y lo que se cuelga de algo, se queda: asocien.',
    alex: 'En 7 días les vamos a mandar un mensaje con una sola pregunta: ¿cuál era la 7? Si la recuerdan, ya saben por qué.',
    tip: 'Seguimiento: una semana después, manden ese mensaje por el grupo de WhatsApp.',
  },
  resumen: {
    t: '46:30–47:30',
    joss: 'Así jugamos hoy: aquí están todos, con su avatar y cómo les fue.',
    alex: 'En su celular ya pueden descargar su recuerdo en PDF: trae su nombre, su avatar, sus respuestas y una guía corta para usar todo esto. ¡Gracias, cerebros!',
    tip: 'Déjenla en pantalla mientras se despiden y reaccionan.',
  },
};

WORD_LINES.forEach((line, i) => {
  const id = 'p' + String(i + 1).padStart(2, '0');
  GUION[id] = {
    t: i === 0 ? '24:00–25:45' : '',
    joss: i === 19 ? 'No toques nada: avanzaron solas. En la 20 se detiene; el siguiente clic lleva a escribir.' : 'No toques nada: avanza sola en 5 segundos.',
    alex: line,
  };
});

// Texto plano para la ventana de notas y el panel.
export function guionText(id) {
  const g = GUION[id];
  if (!g) return '';
  return [g.t && `⏱ ${g.t}`, g.joss && `JOSS: ${g.joss}`, g.alex && `ALEX: ${g.alex}`, g.tip && `👉 ${g.tip}`].filter(Boolean).join('\n\n');
}
