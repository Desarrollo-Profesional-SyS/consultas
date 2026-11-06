# CLAUDE.md · Rediseño del bot de WhatsApp en el CRM de SyS

Este documento te da todo lo necesario para rediseñar, dentro del CRM, el bot de los embudos **ISO + Calidad**, **Manufactura y Calidad** y **Core Tools Premium** de Desarrollo Profesional SyS (eje Cursos).

Se basa en dos mediciones del CRM: del 5 al 15 de octubre y del 16 de octubre al 5 de noviembre de 2026 (1,152 leads, 12,590 envíos). También incluye las decisiones que el usuario tomó después de verlas.

Contiene:

- las reglas de trabajo y las decisiones ya tomadas;
- el contexto del negocio y lo que dicen los datos;
- cómo funciona el motor del bot del CRM;
- el bot actual y el bot nuevo, etapa por etapa, con sus textos;
- el orden para implementarlo y probarlo.

---

## 0. Reglas de trabajo (léelas primero)

1. **El CRM está en producción y le escribe a clientes reales.**
   - No guardes ningún cambio (`PUT`, `POST`, `PATCH` o `DELETE`) sin la aprobación explícita del usuario para ese cambio concreto.
   - Antes de cada cambio, muestra el antes y el después.
2. **Respalda antes de tocar.**
   - Antes de modificar la secuencia de una etapa, guarda su configuración actual (`GET /etapas/:id/secuencia`) en un archivo JSON.
   - Si algo sale mal, se restaura con `PUT` usando ese respaldo.
3. **Prueba primero fuera de producción.** Usa un embudo de prueba (`POST /embudos/:id/duplicar`) o un número de prueba antes de cambiar los embudos reales.
4. **Nunca hagas estas llamadas:**
   - `POST /conversaciones/:id/vista` ni `POST /conexion/latido`: cambian el estado de lectura o de conexión del equipo;
   - no le mandes mensajes a leads reales;
   - no inicies ni detengas secuencias de conversaciones reales, salvo una prueba aprobada.
5. **Credenciales.** El usuario te las da al empezar. No las escribas en archivos ni en commits.
6. **Datos personales.** No copies nombres, teléfonos, correos ni textos de leads a ningún archivo.
7. **Ventana de 24 h de WhatsApp.**
   - Si pasaron más de 24 h desde el último mensaje del lead, solo se pueden mandar plantillas aprobadas por Meta. Si no, el CRM registra `ventana_cerrada` y el mensaje no sale.
   - Las plantillas de Meta no llevan fechas exactas, solo estimaciones («en tus próximas dos quincenas»).
8. **Si algo de este documento no coincide con lo que ves en el CRM, gana el CRM.** La API se documentó a partir del código de la página del 16 de octubre. Antes de guardar, verifica la forma exacta de cada objeto con un `GET`.

---

## 1. Decisiones del usuario (no se discuten, se implementan)

1. **Horario de atención: de 7:00 a 22:00 h** (hora de Monterrey).
   - Fuera de ese horario **no sale ningún mensaje del CRM**: ni seguimientos, ni plantillas, ni mensajes de asesores.
   - **Única excepción:** la respuesta inmediata a un lead que escribe fuera de horario. Recibe la información básica y el aviso del horario de atención.
   - **Sin hostigamiento:** pocos mensajes, espaciados y solo dentro del horario.
2. **El bot se presenta como «el asistente de Desarrollo Profesional SyS».**
   - No usa el nombre de una persona; hoy firma «Salma Pérez» y eso se quita.
   - Así se distingue del asesor. Cuando el asesor entra a la conversación, se presenta con su nombre.
3. **Ya no se pide el nombre para dar la información.**
   - Se quita la condición del nombre.
   - Cuando el lead pulsa que quiere más información, el bot le manda la información básica: beneficios, costo y el flyer inicial.
4. **Botones (call to action) en los mensajes para segmentar.** Sirven para distinguir al que quiere más información del que solo está comparando precios.
5. **Dos clasificaciones dentro de cada embudo: Caliente y Frío.**
6. **Simplificar los mensajes y el embudo** con lo que el análisis mostró que funciona: escritura, tono y lenguaje.
7. **La ruta en PDF y el audio corto los hace el asesor.**
   - Reemplazan el audio actual de 2 minutos y los links de las rutas.
   - No hay guion para el audio.
   - Ese módulo vive en otro sistema (el de ventas) y **se trabaja aparte**. En el CRM solo se deja la conversación con el asesor y una tarea para mandarlos.
8. **La llamada se mueve al punto donde sirve.**
   - Hoy sale sola a media conversación; pasa a ofrecerse cuando el lead tiene más dudas o está por decidir.
   - Siempre como opción junto con seguir por chat, nunca como única vía.
   - La llamada puede ser el cierre de la venta.
9. **Los pasos con precios de $2,799 y $3,799 no se borran.**
   - Las etapas y los mensajes de esas ofertas se quedan en el embudo, pero el flujo normal **se los salta**. El bot nunca manda una oferta por su cuenta.
   - **Cualquier asesor puede usarlas**, sobre todo como respuesta a una objeción de precio.
   - La meta es vender más **y a mayor precio**. Por eso el orden es:
     1. defender $3,999 con el pago en partes;
     2. si la objeción sigue, $3,799;
     3. $2,799 solo como último recurso.
10. **Lenguaje neutral y un solo tono.**
    - Nada de «Inge»: no todos los leads son ingenieros.
    - Todos los mensajes en la misma línea: un punto medio entre profesional y casual, para público en general (sección 5.6).
11. **Los fríos no se abandonan: tienen un seguimiento más pausado.**
    - El filtro existe para que los asesores dediquen su esfuerzo a los leads con más probabilidad de compra.
    - Los fríos siguen recibiendo seguimiento, a un ritmo más lento. En cuanto escriben, se actualizan a Caliente.
    - **Lo hace el bot**, con plantillas espaciadas en unos 60 días.
    - **Mientras la ventana de 24 h siga abierta, un asesor puede intentar pasarlo a caliente** con un mensaje corto. Es lo más ágil y conviene hacerlo cuando haya capacidad.
12. **Datos operativos ya resueltos (no preguntes):**
    - **Horario:** de lunes a domingo.
    - **Flyer:** cada embudo ya tiene el suyo en su etapa 1.2 (sección 5.4). Para el embudo de prueba se usa el de **Promo Lean**.
    - **Datos bancarios oficiales:** ya están en la plantilla de la etapa de transferencia (imagen `cuenta-para-transferencia.png`). Se conservan tal cual.
    - **Plantillas de Meta:** su alta va aparte y **no bloquea el trabajo en el embudo**. Arma las secuencias completas; donde vaya una plantilla que todavía no existe, deja un paso `nota` marcado «PENDIENTE PLANTILLA <nombre>», con el texto. Cuando Meta la apruebe, se cambia por el paso `mensaje` con la plantilla.

---

## 2. Contexto del negocio

**El producto.** Una membresía de **$3,999 MXN** con **64 cursos en línea durante 12 meses**.

- Cada curso incluye su **constancia DC-3 avalada por la STPS** y su diploma, **sin costo extra**.
- Cada embudo vende un programa de entrada que luego da acceso a todo el catálogo:
  - ISO + Calidad: 9 certificaciones.
  - Manufactura y Calidad: 6 certificaciones.
  - Core Tools Premium: 8 certificaciones.

**Cómo llega el lead.** Llega por un anuncio de Meta que abre WhatsApp. Casi siempre su primer mensaje es el texto automático del anuncio.

**Precio y formas de pago (política vigente).**

- **Precio de lista: $3,999.**
- **Pago completo:** transferencia, depósito, PayPal o tarjeta.
- **Pago en partes:** apartado de **$1,000** y **2 abonos de $1,499.50** en quincena, **hasta 45 días**. El plazo subió de un mes a 45 días para que los abonos caigan en quincena.
- **Meses sin intereses:** 3, 6, 9 o 12 meses con tarjeta de crédito; hay que tener disponible el total.
- Los accesos se activan con el primer pago, aunque sea el apartado.
- Estudiantes: 15% de descuento con credencial o kárdex, **solo si el lead lo menciona**.
- **Ofertas de $3,799 y $2,799:** las puede usar cualquier asesor ante una objeción de precio, después de defender $3,999 con el pago en partes (decisión 9). El bot no las manda.

---

## 3. Lo que dicen los datos (por qué se rediseña)

| Hallazgo | Dato |
|---|---|
| La mitad de los leads es fría | 54% no contestó o solo dio su nombre en 24 h. Dejaron 2 de 37 ventas. |
| **Cuándo marcar frío: a las 2 h** | Con el saludo actual, 95% de los que contestan lo hacen en la primera hora y 80% de los compradores en 2 h. Como el frío vuelve a Caliente en cuanto escribe, marcarlo a las 2 h no pierde ventas y deja casi toda la ventana de 24 h para que un asesor lo intente. |
| **Un asesor sí convierte fríos dentro de la ventana** | Dentro de las 24 h, el mensaje de un asesor a un frío contesta 17% (373 envíos); el del bot, 1% (2,274). Fuera de la ventana, ambos alrededor de 2%. |
| Señal desde el minuto cero | El 7% que escribe su propio primer mensaje (no el texto del anuncio) hizo 18 de 37 ventas. |
| **Preguntar el precio no es ser frío** | De los leads que preguntaron el costo, 19% compró (23 de 119), contra 7% del total de calientes. El que «solo quiere el precio» es frío solo si recibe el precio y ya no sigue. |
| Funciona pedir algo fácil | «¿En qué área trabajas?»: 34% (75% de los calientes). «¿Te muestro las facilidades?»: 28%. Pedir el nombre: 65%, aunque ya no se usa (decisión 3). |
| **Los botones casi no se pulsan** | Los botones de las ofertas se pulsaron entre 1% y 3%. Casi siempre el lead contesta con sus propias palabras. **Toda rama de botones debe tratar el texto libre igual que el botón positivo.** |
| **La llamada, donde está hoy, no funciona** | Se ofreció 311 veces, unos 12 min después del último mensaje del lead, a media conversación. Contestó 28%, pero solo 33 (11%) la aceptaron o preguntaron por ella; 18 dijeron que no podían o que preferían seguir por chat. El equipo tuvo que explicar 18 veces «la llamadita es para que te sientas en confianza…». |
| Prueba natural del 30 de octubre | En Negativo, la pregunta corta superó al audio + imagen + link: 6.5% contra 4.2% (en calientes, 17.6% contra 10.7%). |
| Las ofertas no funcionan | Los toques de información y oferta de Negativo contestan entre 0% y 5%. |
| Las ofertas abaratan el precio | Circularon seis precios: $3,999, $3,799, $3,399, $2,799, $2,399 y $999 al mes. |
| A los fríos casi nada los reactiva | Alrededor de 2%, con o sin oferta. Hubo 1,588 envíos de ofertas a fríos. |
| El seguimiento del mismo día rescata | Con el lead de 2 a 24 h sin escribir, el mensaje de una persona rescata 24%. Después de 24 h, 8%. |
| Estilo que contesta más | Corto (46% contra 39% del largo), sin link (46% contra 29%) y una sola pregunta. El audio no le gana al texto. |
| «Inge» | El bot pone «Inge» como nombre cuando el lead no da el suyo, y el equipo lo copió (más de 1,400 envíos). |
| Tono disparejo | Hay mensajes muy formales y otros muy casuales («Que onda», «que gustazo», «un montón», mayúsculas, varios emojis). |
| Error del bot actual | El 66% vuelve a escribir después de la recomendación, pero el bot pasa a Negativo al 55% de ellos, 4 h después de su último mensaje. |

«Contestó» = el lead escribió después del mensaje y antes del siguiente envío.

Detalle completo en `mensajes-16oct-5nov/` y `audios-paso-1.2/`.

---

## 4. El CRM por dentro

**URL:** https://crm-web-production-3b33.up.railway.app/

**Sesión.** Se inicia con `POST /auth/login`, que deja una cookie de sesión, y se verifica con `GET /auth/yo`.

### 4.1 Horario de los bots

- **Leer:** `GET /ajustes/horario-bots`.
- **Guardar:** `PUT /ajustes/horario-bots`.
- **Campos:** `{activo, desde, hasta, zona, dias}`. `desde` y `hasta` van en **minutos desde la medianoche**.
- **Hoy:** `{"activo": true, "desde": 540, "hasta": 1260, "dias": [1,2,3,4,5,6,7], "zona": "America/Monterrey"}`, es decir, de 9:00 a 21:00, de lunes a domingo.
- **Cambio:** **`desde: 420` (7:00) y `hasta: 1320` (22:00)**. Los días se quedan de lunes a domingo.

El horario aplica a las secuencias con `soloEnHorario: true`. Fuera de horario, esas secuencias esperan a que vuelva a abrir.

### 4.2 Embudos y etapas

Cada embudo tiene etapas. Cada etapa puede tener:

- un **bot**: una secuencia de pasos que arranca cuando la conversación entra a la etapa;
- **disparadores**, que hoy están vacíos en estos tres embudos.

Las conversaciones entran por el embudo «Leads entrantes» y de ahí pasan a su embudo.

| Embudo | ID del embudo |
|---|---|
| ISO + Calidad | `89135bd0-48c8-4f02-9ddc-670cfac66528` |
| Manufactura y Calidad | `347eff8b-97e6-4652-bf38-de1e4a66b296` |
| Core Tools Premium | `77c0bda0-5cda-4898-9c8c-b44a3efc18ff` |

**ISO + Calidad**

| Etapa | ID |
|---|---|
| 1 Saludo | `148952b5-78bb-4cb1-956d-8276ba280ae2` |
| 1.1 Informes | `3afffe90-34b7-44cf-8ce2-0092f5099cbc` |
| 1.2 Lista de cursos | `633fae19-f346-49d6-b3f2-13db68d57a4d` |
| 1 Negativo | `6be5a652-581b-48a9-b829-cf562ecc3fd8` |
| 1.3 Llamadita y facilidades de pago | `77ceabc2-a9b9-4587-8010-dff5981fc485` |
| 1.4 Facilidades de pago | `be1122f6-9e9b-4eb6-bf82-f3ab511116d8` |
| 2 Una sola exhibición | `eeb9760c-cfd9-4aec-958a-6b0970600aa5` |
| 2 Parcialidades | `da76c30a-02a6-4fcb-bd32-fabb564d4b69` |
| MSI | `484e1166-1004-4baf-9e9f-5d790446890f` |
| 2 MSI 3999 | `9be9763b-356e-4a8a-9446-3da67adfbb51` |
| MSI 2799 | `33b793a3-8ac4-4204-aeb2-d23f1ab247e3` |
| 3 Transferencia / OXXO | `7736daf0-c35a-4382-8e0a-e38c897cfcc8` |
| 3 PayPal | `6119bc9a-213a-4067-840b-3ffdce2b19ae` |
| 3 Débito / Crédito | `00e590b7-63d4-4fe9-a083-9a9e1d25b739` |
| Ganado | `41bdcdd7-bd55-4dbf-b35e-71cfe66ba7c4` |
| Perdido | `1a47624d-8856-4331-9299-bd1995f09fb1` |

**Manufactura y Calidad**

| Etapa | ID |
|---|---|
| Leads entrantes | `9373908c-dd8c-4743-8162-7cf187523ae9` |
| 1 Saludo | `6395cbea-e917-477f-916c-4b1b2656c19e` |
| 1.1 Informes | `80a35540-1f7b-4cd8-addf-7fdc98a9e0a2` |
| 1.2 Lista de cursos | `04ee9bba-664f-4edd-9bfb-21ca893b1c0c` |
| 1.2.1 Negativo | `51c21dd2-c8f6-48ef-93b2-1b22d9c59c36` |
| 1.3 Llamadita y facilidad de pago | `fc08c7fb-2c6e-41c3-b025-339011579698` |
| 1.4 Facilidad de pago | `4f09c5e3-a361-46a3-961f-cbc1ca125d49` |
| 2. Una sola exhibición | `a2409569-0de3-4034-9293-e0f8bad19ea0` |
| 2. Parcialidades | `15f5e39c-a077-4df4-b6ce-e3d1ac3a3e8a` |
| 2 MSI 3999 | `8951ec67-24ba-4cc3-9b7e-93977f215a6d` |
| MSI 2799 | `589268a4-597f-471d-9a42-f98115ee8c83` |
| 2. MSI | `6f279576-a6d6-4c11-a797-bd1549b6946a` |
| 3. Transferencias / OXXO | `937add75-246a-439b-89b6-f270129b350a` |
| 3. PayPal | `6c56cb9e-cbfc-4cc5-bce5-712743dd9a8e` |
| 3. Débito / crédito | `1514c901-71a1-4d7a-9e82-e34b0be28cc6` |
| Ganado | `a6f3c109-c553-4f6b-a307-b74d68d06366` |
| Perdido | `09ae92f1-d5f1-4ee9-8c29-aaef54a1297a` |

**Core Tools Premium**

| Etapa | ID |
|---|---|
| Leads entrantes | `67cfe2fa-681a-4c7c-83e8-fa95bb551c5c` |
| 1 Saludo | `c81923fb-c4e7-4630-a746-37ef4cb2db90` |
| 1.1 Informes | `0c19f0c2-7818-4de2-ab25-68f27dea598e` |
| 1.2 Lista de cursos | `002aa9ab-5d46-479b-a617-7426eb257231` |
| Negativo 1 | `61a11550-26c8-41a0-8269-74b36173ab37` |
| 1.3 Llamadita y facilidad pago | `9728dc76-05fa-4353-8018-60ab20a7b64d` |
| 1.4 Facilidades de pago | `02fce3b1-8dfc-4ddd-b61b-65cc0e5f677f` |
| 2. Una sola exhibición | `23d560f3-f30e-4885-8737-340e553dafe5` |
| 2. Parcialidades | `09446854-0e13-4d49-bc1f-47d7ad818f0f` |
| MSI | `aaa8fac5-fb3d-470e-8c65-e6ed16422515` |
| 2. MSI 3999 | `d0f1348e-dac3-4751-96aa-24dd3c2f8885` |
| 2. MSI 2799 | `f651f173-d761-4493-9b82-19e48d2e8ab3` |
| 3 Transferencia / OXXO | `2d3b86ce-cc7e-4e9b-9448-e9c63c9ebc82` |
| 3. PayPal | `879d9dde-388c-43c8-85fd-5ae088700a38` |
| 3. Débito / crédito | `0fb21456-b4cf-4b21-89c5-648318e61ef4` |
| STBY clientes con interés | `35d2c841-0cda-422d-bd6e-eae49248adfa` |
| Ganado | `2943b2a0-cc14-4e45-b427-5ac22dadcd2d` |
| Perdido | `f8c5e841-b7c3-43c0-b3ce-8b61694eb840` |

Embudo de entrada «Leads entrantes»: `6a8a7cbf-ee72-4f4f-b437-e956c38114bf`

### 4.3 La secuencia (el bot de una etapa)

- **Leer:** `GET /etapas/:etapaId/secuencia`.
- **Guardar:** `PUT /etapas/:etapaId/secuencia`. Reemplaza la secuencia completa.
- **Borrar:** `DELETE /etapas/:etapaId/secuencia`.

Cuerpo del `PUT` (así lo manda la página):

```json
{
  "activa": true,
  "detenerAlResponder": false,
  "soloEnHorario": true,
  "pasos": [
    { "clave": "bienvenida", "tipo": "mensaje", "config": { "texto": "Hola…" } }
  ]
}
```

Opciones de la secuencia:

| Opción | Qué hace |
|---|---|
| `activa` | Enciende o apaga el bot de la etapa. |
| `detenerAlResponder` | Detiene el bot cuando el cliente escribe. Hoy está en `false` en todas las etapas. |
| `soloEnHorario` | Solo envía dentro del horario de los bots. Hoy solo está activa en Negativo. **En el bot nuevo va activa en todas las etapas menos la de bienvenida.** |
| `esperasEnHorario` | Aparece en los datos guardados (por ejemplo, 1.2, 1.3 y 1.4) pero no en el cuerpo que manda la página. Antes de usarla, verifica si el `PUT` la acepta. |

Cada paso tiene `clave` (su nombre, sirve para saltar a él), `tipo` y `config`:

| `tipo` | `config` | Qué hace |
|---|---|---|
| `mensaje` | `{texto}` · `{texto, archivoId}` · `{texto, plantilla:{idioma:"es", nombre:"<plantilla_meta>"}}` · con botones (ver 4.4) | Manda texto, un archivo, una plantilla de Meta o un mensaje con botones. |
| `pausa` | `{segundos}` | Espera antes del siguiente paso. |
| `esperar` | `{segundos, siResponde, siNoResponde, siRespondePaso?, siNoRespondePaso?, siRespondeEtapaId?, siNoRespondeEtapaId?}` | Espera a que el cliente escriba. Cada rama puede: `"continuar"`, `"detener"`, saltar a un paso (`…Paso: "<clave>"`) o mover a una etapa (`…EtapaId`). |
| `condicion` | `{campo, operador, valor, siCumple:{accion:"continuar"\|"ir_a", paso}, siNoCumple:{…}}` | Compara un campo. Operadores: `igual`, `distinto`, `contiene`, `no_contiene`, `vacio`, `no_vacio`, `mayor`, `menor`. |
| `ir_a` | `{paso}` (verificar) | Salta a otro paso del mismo bot. |
| `establecer_campo` | `{campo, valor}` | Guarda un valor en un campo de la conversación. |
| `cambiar_etapa` | `{etapaId}` | Mueve la conversación y arranca el bot de esa etapa. |
| `asignar` | `{}` (verificar opciones) | Deja la conversación con una persona. |
| `tarea` | `{tipo:"Seguimiento", texto, plazoSegundos, asignarA:"responsable"}` | Crea una tarea con fecha límite. |
| `nota` | `{texto}` | Nota interna en el hilo; el cliente no la ve. |
| `reaccion` | `{}` | Pone un corazón al último mensaje del cliente. |
| `detener` | `{}` | Termina el bot. |

### 4.4 Mensajes con botones (para segmentar)

Un paso `mensaje` **sin plantilla de Meta** puede llevar botones de respuesta y ramas. Así lo guarda la página:

```json
{
  "tipo": "mensaje",
  "config": {
    "texto": "¿Qué te gustaría saber?",
    "botones": ["Más información", "Solo el precio"],
    "ramas": {
      "segundos": 86400,
      "porBoton": {
        "Más información": { "accion": "ir_a", "paso": "info" },
        "Solo el precio": { "accion": "ir_a", "paso": "precio" }
      },
      "otra": { "accion": "ir_a", "paso": "info" },
      "sin": { "accion": "ir_a", "paso": "frio" }
    }
  }
}
```

- **Límites:** máximo **3 botones** de **20 caracteres** cada uno. Lo valida la página y es el límite de WhatsApp.
- **Acciones de cada rama:**
  - `{"accion":"continuar"}`;
  - `{"accion":"ir_a","paso":"<clave>"}`;
  - `{"accion":"etapa","etapaId":"<id>"}`, que mueve a otra etapa.
- **Qué significa cada rama:**
  - `porBoton`: el lead tocó ese botón;
  - `otra`: escribió cualquier otra cosa;
  - `sin`: no contestó en `segundos` (por defecto 24 h).
- **Solo dentro de 24 h.** Los botones se mandan en mensajes libres, dentro de la ventana de 24 h. En una plantilla de Meta los botones vienen de la plantilla aprobada; la página borra `botones` si el paso usa plantilla.
- **Regla de este rediseño:** la rama `otra` nunca se trata como «no contestó». Si el lead escribe en lugar de tocar el botón, va por el camino caliente.

### 4.5 Variables y campos

**Variables en textos.**

- `{{nombre}}`: el nombre del cliente. **El bot nuevo no lo usa** porque ya no se pide (decisión 3); puede ser el nombre del perfil de WhatsApp. Los asesores sí usan el nombre cuando lo conocen.
- `{{numero}}`: se usaba en el link de la ruta, que se deja de mandar (decisión 7).

**Campos de la conversación (para `condicion` y `establecer_campo`).**

- **Del sistema:**
  - `nombre`: se puede escribir;
  - `mensaje`: lo último que escribió el cliente;
  - `etapa`;
  - `anuncio` y `anuncio_id`;
  - `fuente`: ADS o SHORTLINK;
  - `ref`;
  - `utm_*`.
- **Personalizados:** `Paso del negativo`, `Curso de interes`, `Area de trabajo`, `Modalidad`, `Forma de pago`, `Proxima cita` y `Origen`.
- **Campos nuevos de este rediseño:** se escriben con `establecer_campo`; verifica que se guarden.
  - `Temperatura`: `Caliente` o `Frío`.
  - `Interés inicial`: `Información` o `Precio`.
  - `Paso del seguimiento`: contador de rondas de los calientes.
  - `Paso del frío`: contador de rondas de los fríos.
  - `Objeción de precio`: `Sí`, o vacío. Lo pone cualquier asesor cuando el lead objeta el precio; habilita las rondas de oferta.

**Seguimiento de una corrida.** `GET /conversaciones/:id/secuencia` muestra cómo terminó el bot en una conversación. Los motivos posibles:

| Motivo | Significado |
|---|---|
| `fin` | Terminó todos sus pasos. |
| `detener` | Terminó en un paso «Detener». |
| `cambio_etapa` | Movió la conversación a otra etapa. |
| `respondio` | El cliente respondió. |
| `sin_respuesta` | El cliente no respondió a tiempo. |
| `cliente_respondio` | Se detuvo porque el cliente escribió. |
| `manual` | La detuvo una persona. |
| `ventana_cerrada` | No pudo enviar: la ventana de 24 h estaba cerrada. |
| `limite_saltos` | Se detuvo por saltar demasiadas veces entre pasos (parece un ciclo). |
| `paso_no_encontrado` | Quiso saltar a un paso que ya no existe. |

### 4.6 Otras llamadas útiles

| Para qué | Llamada |
|---|---|
| Listar embudos y etapas | `GET /embudos` |
| Crear, renombrar o reordenar etapas | `POST /embudos/:id/etapas` · `PATCH /etapas/:id` · `PUT /embudos/:id/etapas/orden` |
| Duplicar un embudo para pruebas | `POST /embudos/:id/duplicar` |
| Plantillas de Meta aprobadas | `GET /whatsapp/plantillas-meta` |
| Respuestas rápidas del equipo (no son las de Meta) | `GET /plantillas` · `POST /plantillas` · `PATCH /plantillas/:id` |
| Disparadores de una etapa | `GET` y `PUT /etapas/:id/disparadores` (cuerpo: `[{tipo, activo, config}]`) |
| Razones de pérdida | `GET` y `PUT /razones-perdida` |
| Métricas de bots | `GET /metricas/bots` |
| Historial de etapas de una conversación | `GET /conversaciones/:id/movimientos` |

---

## 5. El bot nuevo (To Be)

### 5.1 Recorrido

```
Lead escribe (cualquier hora)
   │
   ▼
1 BIENVENIDA (responde siempre, también fuera de horario)
   «Soy el asistente de Desarrollo Profesional SyS…»  [Más información] [Solo el precio]
   │
   ├─ toca «Más información» o escribe algo ──► INFO: beneficios + costo + flyer
   │                                              «¿En qué área trabajas o qué estudias?»
   │                                              ──► CALIENTE (asesor: ruta PDF + audio corto)
   │
   ├─ toca «Solo el precio» ──► PRECIO + flyer  [Quiero mi ruta] [Formas de pago]
   │                              ├─ toca o escribe ──► CALIENTE (o 1.4 si eligió formas de pago)
   │                              └─ no sigue en 2 h ──► FRÍO
   │
   └─ no contesta en 2 h ──► FRÍO

CALIENTE ─► el asesor conversa ─► 1.4 FORMAS DE PAGO [Pago en partes] [Meses sin intereses] [Pago completo]
                                    ├─ elige ──► 2 Parcialidades / 2 MSI 3999 / 2 Una sola exhibición ──► 3 medios de pago ──► GANADO
                                    └─ duda o no elige en 3 h ──► 1.3 LLAMADA [Prefiero llamada] [Seguir por aquí]
CALIENTE sin respuesta 24 h ──► SEGUIMIENTO CALIENTES (5 rondas en ~15 días) ──► PERDIDO
FRÍO ──► (opcional) mensaje de un asesor mientras la ventana de 24 h siga abierta
     ──► bot: 5 plantillas espaciadas (días 3, 7, 15, 30 y 60) ──► PERDIDO
     (si responde en cualquier momento ──► CALIENTE)
Etapas de $3,799 / $2,799 ──► se quedan; el flujo normal las salta. Las usa el asesor ante una objeción de precio.
```

### 5.2 La regla de clasificación

**Caliente**, cualquiera de estas:

- tocó «Más información»;
- tocó «Quiero mi ruta» o «Formas de pago» después del precio;
- escribió cualquier cosa, por ejemplo su propia pregunta o su área.

**Frío**, cualquiera de estas:

- no contestó nada en 2 h;
- tocó «Solo el precio» y en 2 h ya no siguió.

**Dónde se guarda:**

- en el campo `Temperatura`;
- moviendo la conversación a la etapa **Caliente** o **Frío**;
- y además en `Interés inicial` (`Información` o `Precio`), para medir.

**Si un frío escribe en cualquier momento,** pasa a Caliente y se asigna a un asesor.

| | Frío | Caliente |
|---|---|---|
| Quién lo lleva | El bot, con seguimiento pausado. Un asesor lo puede intentar mientras la ventana siga abierta. | Un asesor; meta de 5 min o menos dentro del horario |
| Mensajes | 5 plantillas en unos 60 días, sin precio de oferta | Ruta en PDF y audio corto (otro sistema), formas de pago y llamada como opción |
| Ofertas | Nunca | Solo ante objeción de precio, y en orden: $3,999 en partes, luego $3,799, luego $2,799 |
| Si se queda callado | Pasa a Perdido después del día 60 | Seguimiento calientes (5 rondas) y luego Perdido |

### 5.3 Horario y fuera de horario

- `PUT /ajustes/horario-bots`: `desde: 420`, `hasta: 1320`, America/Monterrey, de lunes a domingo.
- **Todas las etapas con `soloEnHorario: true`, menos «1 Bienvenida».** La bienvenida responde siempre, porque contesta a algo que el lead acaba de escribir o tocar.
- **Fuera de horario, el lead recibe:**
  - la bienvenida con los botones;
  - la información básica y el flyer si toca «Más información»;
  - el aviso de horario.

  Nada más. El asesor le escribe a partir de las 7:00 h.
- **Detectar fuera de horario:** verifica si el motor tiene un campo o condición de hora.
  - **Si existe:** fuera de horario manda la información básica directamente (sin esperar el botón) junto con el aviso: «En este momento nuestro equipo no está disponible; te atendemos de 7:00 a 22:00 h. Mientras, te dejo la información».
  - **Si no existe:** deja la línea de horario fija en la bienvenida, que es cierta a cualquier hora. Avísale al usuario que, para el aviso solo nocturno, el desarrollador del CRM tendría que agregar esa condición.
- **Cuidado con la cola de las 7:00.** Las secuencias detenidas por la noche salen al abrir. Revisa que no se junten varios mensajes para el mismo lead a esa hora.

### 5.4 Etapas y textos

Los textos siguen la guía de tono (5.6). `{programa}` y `{n}` cambian por embudo:

| Embudo | `{programa}` | `{n}` | Flyer inicial (`archivoId`, hoy en su etapa 1.2) |
|---|---|---|---|
| ISO + Calidad | ISO + Calidad | 9 certificaciones | `edffb32e-5824-4a70-aaed-fcbea952ecc1` (lista-de-cursos-iso.png) |
| Manufactura y Calidad | Manufactura y Calidad | 6 certificaciones | `cbedf527-903f-42c5-87c3-5996237b4ad0` (lista-de-cursos.png) |
| Core Tools Premium | Core Tools | 8 certificaciones | `4351f867-d473-4da9-9e75-a532d287297b` (lista-de-cursos.png) |
| **Prueba (Promo Lean)** | Lean Manufacturing + 7 certificaciones | 8 certificaciones | `b766c439-bf59-463d-b6a0-9e57c3a44223` (CRM Promo Lean.png) |

Antes de usar un flyer, verifica el `archivoId` con `GET /archivos/:id/info`.

#### 1 Bienvenida (hoy «1 Saludo»; se puede renombrar)

**Configuración:** `soloEnHorario: false`. Es la única etapa así.

**Se quitan:**

- la firma «Salma Pérez»;
- la pregunta del nombre y su espera de 30 min;
- el paso `establecer_campo nombre = "Inge"`;
- el mensaje «Hola Inge, no te preocupes…».

**Pasos:**

1. **`bienvenida`** · mensaje con botones «Más información» y «Solo el precio»:
   > ¡Hola! 👋 Soy el asistente de *Desarrollo Profesional SyS*. Gracias por tu interés en *{programa}*.
   > Nuestro equipo te atiende de 7:00 a 22:00 h (hora de Monterrey).
   > ¿Qué te gustaría saber?

   Ramas:
   - «Más información» → `info`;
   - «Solo el precio» → `precio`;
   - `otra` → `info`;
   - `sin` (7,200 s, 2 h) → `frio`.
2. **`info`:**
   - `establecer_campo Temperatura = Caliente`;
   - `establecer_campo Interés inicial = Información`;
   - mensaje con el **flyer inicial** (`archivoId`, que da el usuario):
     > Con gusto. *{programa}* incluye *{n}* y, con la membresía, tienes acceso a los *64 cursos* del catálogo durante 12 meses.
     > • 100% en línea y a tu ritmo.
     > • Cada curso incluye su constancia *DC-3 avalada por la STPS* y su diploma, sin costo extra.
     > • Costo: *$3,999*, que puedes pagar completo, en partes o a meses sin intereses.
3. `pausa` de 5 s.
4. **`area`** · mensaje:
   > Para que un asesor te prepare una ruta personalizada, ¿en qué área trabajas o qué estudias?
5. `cambiar_etapa → Caliente`. La etapa Caliente asigna y crea la tarea del asesor.
6. **`precio`:**
   - `establecer_campo Interés inicial = Precio`;
   - mensaje con el flyer y los botones «Quiero mi ruta» y «Formas de pago»:
     > La membresía cuesta *$3,999* e incluye los 64 cursos durante 12 meses, cada uno con su DC-3 y su diploma, sin costo extra. Puedes pagarla completa, a meses sin intereses o en partes: $1,000 de apartado y 2 abonos en tus próximas dos quincenas.
     > ¿Cómo te gustaría seguir?

   Ramas:
   - «Quiero mi ruta» → `rutaPrecio`;
   - «Formas de pago» → `pagoPrecio`;
   - `otra` → `rutaPrecio`;
   - `sin` (7,200 s, 2 h) → `frio`.
7. **`rutaPrecio`:**
   - `establecer_campo Temperatura = Caliente`;
   - `ir_a area`.
8. **`pagoPrecio`:**
   - `establecer_campo Temperatura = Caliente`;
   - `asignar`;
   - `cambiar_etapa → 1.4 Facilidades de pago`.
9. **`frio`:**
   - `establecer_campo Temperatura = Frío`;
   - `cambiar_etapa → Frío`.

**Opcional (caliente desde el minuto cero):** al inicio, una `condicion` sobre `mensaje` contra el texto automático de los anuncios del embudo. Si el primer mensaje no es el del anuncio, el lead escribió su propia pregunta:

- `Temperatura = Caliente`;
- mandar la información;
- `cambiar_etapa → Caliente`;
- `nota`: «Escribió su propia pregunta: contestarla primero».

Pide al usuario esos textos.

#### Caliente (etapa nueva, después de Bienvenida)

**Configuración:** `soloEnHorario: true`.

**Pasos:**

1. `asignar`.
2. `nota`: «Caliente. Mandar la ruta en PDF y un audio corto desde el sistema de ventas. Presentarse con su nombre. Contestar en 5 min o menos dentro del horario».
3. `tarea`: «Enviar ruta PDF + audio corto», con `plazoSegundos: 900` y `asignarA: "responsable"`.
4. `tarea`: «Si no ha contestado en 24 h, moverlo a Seguimiento calientes», con `plazoSegundos: 86400` y `asignarA: "responsable"`.
5. `detener`.

**Fuera del CRM:** el contenido de la ruta, el PDF y el audio se trabajan aparte en el sistema de ventas. **No escribas guion de audio.**

#### Frío (etapa nueva)

**Configuración:** `soloEnHorario: true`. Contador `Paso del frío`, igual que el de calientes.

**Objetivo:** seguimiento pausado del bot. Si cualquier respuesta llega, el lead pasa a Caliente.

**Pasos:**

1. **`ventana`:**
   - `tarea` para el equipo: «Lead frío con la ventana de 24 h abierta: un mensaje corto de asesor puede pasarlo a caliente. Opcional, si hay capacidad». Con `plazoSegundos: 72000`.
   - **No uses `asignar`**: el frío no debe entrar a la cola normal del asesor. Verifica a quién se le puede asignar la tarea (`asignarA`).
2. `esperar` 79,200 s (22 h, lo que queda de la ventana). Si responde, salta a `reactivo`.
3. **Ronda 1, día 3:** plantilla **`sys_frio_ruta`** (botones de Meta: «Sí, me interesa» y «Ahora no»):
   > Hola 👋 ¿Sigues buscando certificarte en {{1}}? Responde «Sí» y un asesor te prepara una ruta según tu área.
4. `esperar` 4 días. Si responde, revisa con `condicion mensaje contiene "Ahora no"` → salta a `pausaLarga`; cualquier otra respuesta → `reactivo`.
5. **Ronda 2, día 7:** plantilla **`sys_frio_demo`** (botones: «Sí, compártela» y «Ahora no»):
   > Hola. Si quieres ver cómo son nuestros cursos por dentro, tenemos una clase de muestra gratuita. ¿Te la compartimos?
6. `esperar` 8 días. Las respuestas se tratan igual que en el paso 4.
7. **Ronda 3, día 15:** plantilla **`sys_frio_dc3`**:
   > Hola. Cada uno de nuestros cursos incluye su constancia DC-3 avalada por la STPS, sin costo extra. ¿Te gustaría que un asesor te cuente cómo funciona?
8. `esperar` 15 días. Las respuestas se tratan igual que en el paso 4.
9. **Ronda 4, día 30:** plantilla **`sys_frio_quincenas`**:
   > Hola. Puedes empezar tu certificación con un apartado y pagar el resto en tus próximas quincenas. ¿Quieres que un asesor te explique cómo?
10. `esperar` 30 días. Las respuestas se tratan igual que en el paso 4.
11. **Ronda 5, día 60 (`cierre`):** plantilla **`sys_frio_cierre`**:
    > Hola. Te dejamos la puerta abierta: cuando quieras retomar tu certificación, escríbenos «Info» y con gusto te ayudamos.
12. `esperar` 7 días. Si responde, salta a `reactivo`. Si no, `cambiar_etapa → Perdido`, con la razón «No contestó» si se puede poner desde el bot.
13. **`pausaLarga`** (tocó «Ahora no»):
    - `pausa` de 30 días;
    - `ir_a cierre`. Solo recibe el mensaje de despedida.
14. **`reactivo`:**
    - `establecer_campo Temperatura = Caliente`;
    - `cambiar_etapa → Caliente`.

**Sin precio de oferta y una plantilla por ronda.** Mientras una plantilla no esté aprobada, deja su paso como `nota` «PENDIENTE PLANTILLA» (decisión 12). La estructura y los tiempos quedan listos.

**Mensaje del asesor dentro de la ventana** (texto libre, opcional):

- **No contestó la bienvenida:**
  > Hola, soy {asesor}, de Desarrollo Profesional SyS 😊 Vi que te interesó {programa}. ¿Te comparto la información o tienes alguna pregunta en particular?
- **Solo pidió el precio:**
  > Hola, soy {asesor}, de Desarrollo Profesional SyS 😊 Además del precio, puedo prepararte una ruta según tu área. ¿En qué área trabajas o qué estudias?

#### 1.1 Informes y 1.2 Lista de cursos

- Su contenido pasa a la bienvenida (información básica y flyer). El link de la ruta lo reemplaza el PDF del asesor.
- **No se borran.** Se dejan con `activa: false` y el flujo normal se los salta.

#### 1.4 Facilidades de pago

**Cómo se llega:**

- desde la rama «Formas de pago»;
- desde el botón de la plantilla E02;
- o porque el asesor la mueve.

**Configuración:** `soloEnHorario: true`.

Mensaje con los botones «Pago en partes», «Meses sin intereses» y «Pago completo»:

> Tienes 3 formas de pagar la membresía de *$3,999*:
> 1. *Pago completo:* transferencia, depósito, PayPal o tarjeta.
> 2. *Pago en partes:* $1,000 de apartado y 2 abonos de $1,499.50 en tus próximas dos quincenas (hasta 45 días).
> 3. *Meses sin intereses:* 3, 6, 9 o 12 meses con tarjeta de crédito.
>
> Tus accesos se activan desde el primer pago. ¿Cuál te acomoda más?

Ramas:

- «Pago en partes» → `etapa` 2 Parcialidades;
- «Meses sin intereses» → `etapa` 2 MSI 3999;
- «Pago completo» → `etapa` 2 Una sola exhibición;
- `otra` → `asignar` y `detener` (el asesor contesta la duda);
- `sin` (10,800 s, 3 h) → `etapa` 1.3 Llamada.

#### 1.3 Llamada (hoy «1.3 Llamadita y facilidades de pago»; se reubica)

**Qué cambia:**

- Ya no sale sola a media conversación.
- Se llega desde 1.4 cuando el lead no elige forma de pago en 3 h.
- Se usa también cuando el asesor la mueve porque el lead tiene dudas o dice «lo voy a pensar».
- Conviene reordenar las etapas para que quede después de 1.4 (`PUT /embudos/:id/etapas/orden`).

**Configuración:** `soloEnHorario: true`.

Mensaje con los botones «Prefiero llamada» y «Seguir por aquí»:

> Si te ayuda, un asesor puede resolver tus dudas en una llamada breve, o seguimos por aquí. ¿Qué prefieres?

Ramas:

- «Prefiero llamada» → `ir_a llamada`;
- «Seguir por aquí» → `ir_a chat`;
- `otra` → `ir_a chat`;
- `sin` (86,400 s) → `etapa` Seguimiento calientes.

Pasos de cada rama:

- **`llamada`:**
  - `establecer_campo Proxima cita = Llamada solicitada`;
  - `asignar`;
  - `tarea`: «Llamar al lead (puede ser el cierre de la venta)», con `plazoSegundos: 1800`;
  - `detener`.
- **`chat`:**
  - `asignar`;
  - `nota`: «Prefiere seguir por chat»;
  - `detener`.

**Se quitan** los textos «Igual si gustas te puedo hacer una llamadita…» y «llamadita» en general.

#### 2 Parcialidades

**Configuración:** `soloEnHorario: true`.

Mensaje con los botones «Transferencia/OXXO», «PayPal» y «Tarjeta»:

> Perfecto. Así funciona el pago en partes: apartas con $1,000 (tus accesos se activan ese día) y cubres el resto en 2 abonos de $1,499.50 en tus próximas dos quincenas, hasta 45 días. Un asesor te comparte las fechas exactas.
> ¿Cómo te gustaría pagar el apartado?

Ramas:

- «Transferencia/OXXO» → `etapa` 3 Transferencia / OXXO;
- «PayPal» → `etapa` 3 PayPal;
- «Tarjeta» → `etapa` 3 Débito / Crédito;
- `otra` → `asignar` y `detener`;
- `sin` (86,400 s) → `etapa` Seguimiento calientes.

Las fechas exactas las manda el asesor con la calculadora de `plantillas-asesores/`. Regla propuesta: los dos abonos caen en las dos últimas quincenas (día 15 o fin de mes) dentro de los 45 días.

#### 2 Una sola exhibición, 2 MSI 3999 y 3 Transferencia / PayPal / Débito

- Conservar la lógica.
- Pasar los textos por la guía de tono: quitar «Inge», mayúsculas y varios emojis, y dejar una sola pregunta.
- Al final de cada una:
  - `soloEnHorario: true`;
  - si no hay respuesta en 24 h, `etapa` Seguimiento calientes.
- Datos bancarios: solo los oficiales que dé el usuario.

#### Seguimiento calientes (hoy «1 Negativo»; renombrar con `PATCH /etapas/:id`)

**Configuración:** `soloEnHorario: true`. Contador `Paso del seguimiento`: si el lead vuelve a caer en la etapa, sigue en la siguiente ronda.

**Plantillas sin nombre**, en voz de la empresa («te preparamos», «te escribimos»):

| Ronda | Cuándo (desde que dejó de escribir) | Plantilla de Meta | Texto |
|---|---|---|---|
| 1 | 24 a 48 h | `sys_seguimiento_ruta` | Hola 😊 Pasamos a saber si pudiste revisar la ruta que te preparamos. ¿Te quedó alguna duda? |
| 2 | 48 a 72 h, de preferencia en la mañana | `sys_reactivacion_ruta` (botones de Meta: «Tengo dudas», «Formas de pago», «Ahora no») | Hola 😊 Te escribimos por tu ruta de certificaciones en {{1}}. ¿Prefieres resolver tus dudas por aquí o conocer las formas de pago? |
| 3 | 4 a 5 días | `sys_apartado_quincenas` | Hola. Por si te sirve: puedes empezar tu membresía con un apartado de $1,000 y cubrir el resto en tus próximas dos quincenas. ¿Te explicamos cómo quedaría? |
| 4 | 7 días | `sys_interes_7_dias` | Hola. ¿Sigue en pie tu interés en certificarte en {{1}}? Si ahora no es buen momento, avísanos y te escribimos más adelante. |
| 5 | 10 a 15 días | `sys_despedida` | Hola. No queremos llenarte de mensajes. Si más adelante quieres retomar tu certificación, escríbenos y con gusto te ayudamos. |
| Fin | 3 días después de la ronda 5 | — | `cambiar_etapa → Perdido` |

- **Entre rondas:** un `esperar` con la duración correspondiente. Si responde, salta a `retomo`:
  - `asignar`;
  - `nota`: «Regresó: contestar en 5 min o menos dentro del horario»;
  - `detener`.
- **Botones de la ronda 2:** si el lead toca «Formas de pago», mover a 1.4 (patrón actual: `condicion mensaje contiene "Formas de pago"`).
- **Ofertas que se quedan pero se saltan (decisión 9):**
  - Las rondas de oferta actuales se conservan al final de la secuencia, sin borrarse: oferta relámpago de $3,799, cierre de $2,799 y «la cerramos hoy».
  - Antes de ellas va `condicion Objeción de precio igual "Sí"`. Si no se cumple, se saltan y se pasa a Perdido.
  - Cualquier asesor marca el campo cuando el lead objeta el precio y ya defendió $3,999 con el pago en partes.
  - Respeta el orden: primero $3,799 y, solo si sigue la objeción, $2,799.
  - Pásalas por la guía de tono: quita «Inge», las mayúsculas y la escasez falsa («quedan 4 lugares», «la cerramos hoy»). Conserva el precio.
- **Salen del flujo normal:**
  - la clase demo como seguimiento (el asesor la manda si el lead la pide);
  - las 4 plantillas de las 64 certificaciones;
  - el CV.

#### Etapas de MSI 2799 / 2. MSI 2799

- **No se borran ni se apagan** (decisión 9).
- Ningún paso automático lleva a ellas: solo el asesor mueve al lead ahí, como último recurso ante una objeción de precio.
- Revisar que sus textos sigan la guía de tono.

#### Otras etapas

| Etapa | Qué hacer |
|---|---|
| 3. Transferencias / PayPal / Débito de **Manufactura** | Hoy las tres mandan la imagen `ultima-oportunidad.png` con «Inge solamente nos quedan 4 lugares para la promoción…» dentro del flujo de pago. Sácala del flujo normal: déjala detrás de `condicion Objeción de precio igual "Sí"` y quítale «Inge» y la escasez. |
| STBY clientes con interés (Core Tools) | Su tarea propone una oferta de $1,500, que no está entre los precios de la decisión 9. No la toques y avísale al usuario. |
| Ganado | Conservar. Pasar el texto por la guía de tono y agregar: «Recuerda que tu DC-3 y tu diploma ya vienen incluidos en tu membresía». |
| Perdido | Sin bot. |

### 5.5 Reglas contra el hostigamiento

1. Ningún mensaje fuera de 7:00 a 22:00 h, salvo la respuesta inmediata de la bienvenida.
2. Como máximo **un mensaje automático por día** por lead, sin contar la información que pidió con un botón.
3. **Fríos:** 5 plantillas en unos 60 días; si tocan «Ahora no», solo la despedida 30 días después. **Calientes en seguimiento:** 5 rondas en unos 15 días.
4. Si el lead escribe, el bot se detiene y lo atiende una persona.
5. Si el lead dice que no le interesa: `asignar`, el asesor cierra con amabilidad y pasa a Perdido. No sale ningún mensaje automático más.

### 5.6 Guía de tono (un solo tono para todo el embudo)

**Punto medio entre profesional y casual, para público en general.**

- Trato de **tú**, cordial y claro.
- **Neutral:** nunca «Inge», ni suposiciones de profesión o género. Usa «tu interés» en lugar de «interesado/a».
- **Sin modismos ni diminutivos:** «Que onda», «que gustazo», «rapidito», «llamadita», «un montón».
- **Sin rigidez corporativa:** «estimado usuario», «le informamos».
- **El bot habla como asistente o en plural** («te preparamos», «un asesor te escribe»). Nunca finge ser una persona.
- **Una sola pregunta, al final.** Si hay botones, la pregunta es la que responden los botones.
- **Corto:** hasta 160 caracteres cuando se puede. La información básica puede ser más larga, pero en viñetas.
- **Un emoji como máximo.** Sin mayúsculas para enfatizar; para resaltar, *negritas* de WhatsApp.
- **Un solo precio, $3,999.** Decir siempre que la DC-3 y el diploma ya vienen incluidos.
- **Sin urgencia ni escasez falsa:** «solo por hoy», «quedan X lugares», «la cerramos hoy».
- **Sin links**, salvo los de pago cuando el lead ya eligió.

| Así no (textos actuales) | Así sí |
|---|---|
| ¡Hola excelente día Inge👋! Te saluda *Salma Pérez* de _*SyS*_ 😊 | ¡Hola! 👋 Soy el asistente de *Desarrollo Profesional SyS*. |
| Excelente {{nombre}} que gustazo! … Te explico rapidito… | Con gusto. *{programa}* incluye *{n}*… |
| Que onda {{nombre}}, recuerda que esta membresía incluye las demás rutas🦾 | Con la membresía tienes acceso a los 64 cursos durante 12 meses. |
| Igual si gustas {{nombre}} te puedo hacer una llamadita… | Si te ayuda, un asesor puede resolver tus dudas en una llamada breve, o seguimos por aquí. ¿Qué prefieres? |
| ¡Tenemos una OFERTA RELÁMPAGO disponible solo por hoy! ⚡ | (Fuera del flujo normal. Ante una objeción de precio: «Entiendo. Si el precio es lo que te detiene, puedo ofrecerte la membresía en $3,799. ¿Te comparto cómo quedaría?») |

### 5.7 Plantillas de Meta que hay que crear

Su alta en Meta va aparte y no bloquea el embudo (decisión 12). Mientras no estén aprobadas, su paso queda como `nota` «PENDIENTE PLANTILLA». Ya aprobadas, se confirman con `GET /whatsapp/plantillas-meta`.

**Variables.** En Meta son `{{1}}`, `{{2}}`. Las del bot no llevan el nombre; `{{1}}` es el tema del embudo. Revisa cómo el CRM llena las variables de una plantilla actual, como `i_c_negativo_2_64_cert_63kkgk`.

**Texto de los pasos.** Al usar una plantilla en un paso, `texto` debe ser el texto de la plantilla.

| Nombre sugerido | Categoría | Quién la manda |
|---|---|---|
| `sys_frio_ruta` | Marketing | Bot, Frío, día 3 |
| `sys_frio_demo` | Marketing | Bot, Frío, día 7 |
| `sys_frio_dc3` | Marketing | Bot, Frío, día 15 |
| `sys_frio_quincenas` | Marketing | Bot, Frío, día 30 |
| `sys_frio_cierre` | Marketing | Bot, Frío, día 60 |
| `sys_seguimiento_ruta` | Marketing | Bot, Seguimiento calientes, ronda 1 |
| `sys_reactivacion_ruta` | Marketing | Bot, ronda 2 |
| `sys_apartado_quincenas` | Marketing | Bot, ronda 3 |
| `sys_interes_7_dias` | Marketing | Bot, ronda 4 |
| `sys_despedida` | Marketing | Bot, ronda 5 |
| `sys_pago_en_partes` | Marketing | Asesor, fuera de 24 h |
| `sys_quincena` | Marketing | Asesor: el lead dijo «en la quincena» |
| `sys_inscripcion_pendiente` | Marketing | Asesor: pidió datos de pago y no pagó |
| `sys_recordatorio_abono` | Utilidad | Asesor: 1 o 2 días antes de la quincena del abono |

Los textos de las plantillas del asesor están en `plantillas-asesores/SyS_Plantillas_de_seguimiento.xlsx`, hoja «Plantillas» (C04, C15, E05 y E06). En la versión que mandes a Meta, cambia el nombre del lead por un saludo neutral si no está confirmado.

---

## 6. El bot actual (As Is), para referencia

Los tres embudos tienen la misma estructura. Cambia el número de certificaciones y el link de la ruta.

| Etapa | Qué hace hoy | Qué pasa en el bot nuevo |
|---|---|---|
| 1 Saludo | Firma «Salma Pérez», dice «Inge», pide el nombre y espera 30 min. Si no contesta, pone `nombre = "Inge"`. | Pasa a ser 1 Bienvenida, con botones. |
| 1.1 Informes | «Te explico rapidito… son 9 certificaciones…» | Se apaga; el contenido va a la bienvenida. |
| 1.2 Lista de cursos | Archivo, link de la ruta, cómo funciona y «¿en qué área trabajas?». A las 2 h lo pasa a Negativo aunque haya contestado. | Se apaga; la pregunta del área va en la bienvenida. |
| 1 Negativo (40 pasos) | 4 rondas: pregunta corta, clase demo, 64 certificaciones y oferta de $3,799, CV y $2,799. Luego Perdido. | Pasa a ser Seguimiento calientes; las ofertas se quedan detrás de `Objeción de precio`. |
| 1.3 Llamadita | Llamada a los 5 min y facilidades a los 10 min. A las 4 h, Negativo. | Pasa a ser 1.3 Llamada, ofrecida en el momento de decidir. |
| 1.4 Facilidades | Tres opciones y «¿Cuál te interesa?». A las 4 h, Negativo. | Botones a las etapas de pago, con 45 días en quincenas. |
| 2 Parcialidades | Desglose y medios de pago. A las 4 h, Negativo. | Botones a los medios de pago, con 45 días en quincenas. |
| MSI 2799 | Meses sin intereses a $2,799. | Se queda; el flujo normal la salta y el asesor la usa como último recurso. |
| STBY (Core Tools) | Tarea con oferta de $1,500. | No se toca; se avisa al usuario. |
| Ganado | Bienvenida y accesos. | Se queda, con ajuste de tono. |

---

## 7. Orden de implementación

Cada fase necesita la aprobación del usuario antes de guardar.

1. **Fase 0. Respaldo, permisos y embudo de prueba.**
   - `GET` de la secuencia y los disparadores de todas las etapas de los tres embudos y de Promo Lean. Guardarlos en `rediseno-bot/respaldo/<embudo>/<etapa>.json` (sin datos de leads).
   - `GET /ajustes/horario-bots` y `GET /whatsapp/plantillas-meta`.
   - Verificar si existe una condición de hora para el aviso fuera de horario.
   - **Permisos:** la cuenta usada hasta ahora (`GET /auth/yo`) es de rol `vendedor` (auxiliar) y puede no tener permiso para editar embudos ni bots. Pregúntale al usuario con qué cuenta trabajar.
   - **Embudo de prueba:** duplica **Promo Lean** (`POST /embudos/a549ed15-1909-4a25-81b7-3a2ceca051ff/duplicar`) y usa su flyer.
     - Antes de activar sus bots, confirma que ninguna ruta de entrada ni campaña apunte a la copia (`GET /rutas-entrada`), para que no le lleguen leads reales.
     - Prueba moviendo a esa copia una conversación de un número de prueba.
2. **Fase 1. Horario y tono.**
   - Horario de los bots de 7:00 a 22:00 h.
   - `soloEnHorario: true` en todas las etapas salvo la bienvenida.
   - Quitar «Inge» y «Salma Pérez».
   - Textos de 1.4, 2 Parcialidades y Ganado con 45 días y la guía de tono.
3. **Fase 2. Bienvenida y clasificación.**
   - Bienvenida con botones y las ramas de información y precio.
   - Etapas Caliente y Frío, y campos nuevos.
   - Apagar 1.1 y 1.2.
4. **Fase 3. Llamada y formas de pago.**
   - Botones de 1.4 y 2 Parcialidades.
   - 1.3 Llamada reubicada y reordenada.
5. **Fase 4. Seguimiento.**
   - Negativo pasa a Seguimiento calientes, con las ofertas detrás de `Objeción de precio`.
   - Etapa Frío completa, con sus 5 rondas.
   - Las plantillas que falten quedan como `nota` «PENDIENTE PLANTILLA» hasta que Meta las apruebe.
6. **Después de probar en la copia de Promo Lean,** se repite en ISO + Calidad, Manufactura y Calidad y Core Tools Premium, con la aprobación del usuario para cada embudo.
7. **Fuera del CRM:** el módulo de ruta en PDF y audio corto en el sistema de ventas. Se trabaja aparte.

### Pruebas (en un embudo duplicado o con un número de prueba)

| Caso | Resultado esperado |
|---|---|
| Escribe a las 23:00 | Recibe la bienvenida con el horario (y la información si toca el botón). Nada más hasta las 7:00. |
| Toca «Más información» | Recibe la información, el flyer y la pregunta del área; pasa a Caliente con tarea para el asesor. |
| Escribe en lugar de tocar un botón | Igual que el caso anterior: Caliente. |
| Toca «Solo el precio» y no sigue | A las 2 h pasa a Frío con `Interés inicial = Precio`. |
| Toca «Solo el precio» y luego «Formas de pago» | Pasa a Caliente y a 1.4. |
| No contesta nada | A las 2 h pasa a Frío y aparece la tarea opcional del asesor. Después recibe las rondas de los días 3, 7, 15, 30 y 60, en horario, y pasa a Perdido. |
| Frío que contesta al mensaje del asesor dentro de la ventana | Pasa a Caliente y se asigna. |
| Frío que toca «Ahora no» | Solo recibe la despedida 30 días después. |
| Frío que responde a cualquier ronda | Pasa a Caliente y se asigna. |
| En 1.4 no elige en 3 h | Pasa a 1.3 Llamada con los dos botones. |
| Toca «Prefiero llamada» | Se asigna, queda la tarea de llamar y se guarda `Proxima cita`. |
| Caliente sin respuesta 24 h | Seguimiento calientes; las rondas salen en horario, una por día como máximo. |
| `Objeción de precio` vacía | Las rondas de oferta se saltan. Con `Sí`, salen en orden ($3,799 y luego $2,799). |
| Envío fuera de 24 h sin plantilla | Si aparece `ventana_cerrada` en la corrida, corregir el paso. |

Revisa cada corrida con `GET /conversaciones/:id/secuencia` y los movimientos con `GET /conversaciones/:id/movimientos`.

**Rollback:** `PUT /etapas/:id/secuencia` con el respaldo de la Fase 0.

---

## 8. Pendientes por confirmar con el usuario

Lo que ya está resuelto no se pregunta (decisión 12): días del horario, flyer, quién usa las ofertas, datos bancarios y plantillas de Meta.

1. Con qué cuenta trabajar. La de solo lectura es de rol `vendedor` y quizá no pueda editar bots.
2. Si el motor no detecta fuera de horario, ¿se deja la línea de horario fija en la bienvenida o se le pide la condición al desarrollador?
3. A quién se le asigna la tarea opcional de los fríos (`asignarA`): un asesor, un auxiliar o el equipo.
4. Los textos automáticos de los anuncios, para el caliente desde el minuto cero (opcional).
5. La regla de fechas de los abonos (las dos últimas quincenas dentro de los 45 días).
6. La tarea de STBY de Core Tools con la oferta de $1,500.
7. Renombrar etapas (1 Saludo, 1 Negativo, 1.3) o crear nuevas. Renombrar conserva el historial.

---

## 9. Cómo medir después

Usar la misma metodología de `mensajes-16oct-5nov/` sobre una tercera muestra y compararla contra las dos anteriores:

- clics en cada botón de la bienvenida, y cuántos escriben en lugar de tocar;
- % de calientes y fríos, y ventas de cada grupo, también por `Interés inicial`;
- respuesta a la pregunta del área y a cada ronda de seguimiento;
- llamadas pedidas con «Prefiero llamada» y cuántas terminan en venta;
- **precio promedio por venta** y % de ventas a $3,999, $3,799 y $2,799. La meta es vender más y a mayor precio;
- fríos que pasan a Caliente: con el mensaje del asesor dentro de la ventana y con cada ronda del bot;
- mensajes enviados fuera de 7:00 a 22:00 h (debe ser 0, salvo la bienvenida);
- plantillas de Meta enviadas a fríos y su costo (antes: 1,588 envíos de ofertas a fríos en el periodo);
- tiempo de respuesta de los asesores a los calientes (meta: 5 min o menos dentro del horario);
- leads calientes que el bot movió por error a seguimiento (debe ser 0).

---

## 10. Archivos de referencia en este repositorio

| Carpeta | Contenido |
|---|---|
| `CONTEXTO_Y_PLAN.md` | Contexto para personas. Si difiere de este documento, manda este. |
| `as-is-3-embudos/` | Diagnóstico del 5 al 15 de octubre |
| `audios-paso-1.2/` | Tiempos y audios de la recomendación |
| `propuesta-clasificacion/` | Propuesta aceptada por Dirección (Word) |
| `mensajes-16oct-5nov/` | Medición de toques, estilo, asesores, dudas y puntos a corregir |
| `plantillas-asesores/` | Guía de estilo, 57 plantillas pulidas y calculadora de pagos para los asesores |
