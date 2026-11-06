# CLAUDE.md · Rediseño del bot de WhatsApp en el CRM de SyS

Este documento te da todo lo necesario para rediseñar, dentro del CRM, el bot de los embudos **ISO + Calidad**, **Manufactura y Calidad** y **Core Tools Premium** de Desarrollo Profesional SyS (eje Cursos).

Se basa en dos mediciones del CRM: del 5 al 15 de octubre y del 16 de octubre al 5 de noviembre de 2026 (1,152 leads, 12,590 envíos).

Contiene:

- el contexto del negocio;
- lo que dicen los datos;
- cómo funciona el motor del bot del CRM;
- el bot actual y el bot nuevo, etapa por etapa;
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

## 1. Contexto del negocio

**El producto.** Una membresía de **$3,999 MXN** con **64 cursos en línea durante 12 meses**.

- Cada curso incluye su **constancia DC-3 avalada por la STPS** y su diploma, **sin costo extra**.
- Cada embudo vende una «ruta» de entrada que luego da acceso a todo el catálogo:
  - ISO + Calidad: 9 certificaciones.
  - Manufactura y Calidad: 6 certificaciones.
  - Core Tools Premium: 8 certificaciones.

**Cómo llega y se atiende el lead.**

1. Llega por un anuncio de Meta que abre WhatsApp. Casi siempre su primer mensaje es el texto automático del anuncio.
2. El bot lo saluda, le pide su nombre, le explica el programa, le manda la lista de cursos y le pregunta su área.
3. Los asesores (Salma, Alexander, Victoria y Joceline) mandan la recomendación con un audio, resuelven dudas y cierran el pago.

**Precio y formas de pago (política vigente).**

- **Un solo precio: $3,999.**
- **Pago completo:** transferencia, depósito, PayPal o tarjeta.
- **Pago en partes:** apartado de **$1,000** y **2 abonos de $1,499.50** en quincena, **hasta 45 días**. El plazo subió de un mes a 45 días para que los abonos caigan en quincena.
- **Meses sin intereses:** 3, 6, 9 o 12 meses con tarjeta de crédito; hay que tener disponible el total.
- Los accesos se activan con el primer pago, aunque sea el apartado.
- Estudiantes: 15% de descuento con credencial o kárdex, **solo si el lead lo menciona**.

---

## 2. Lo que dicen los datos (por qué se rediseña)

| Hallazgo | Dato |
|---|---|
| La mitad de los leads es fría | 54% no contestó o solo dio su nombre en 24 h. Dejaron 2 de 37 ventas. |
| Clasificar a las 24 h, no antes | A las 2 h se irían 9 compradores al trato de fríos; a las 24 h, solo 2. |
| Señal desde el minuto cero | El 7% que escribe su propio primer mensaje (no el texto del anuncio) hizo 18 de 37 ventas. |
| Funciona pedir algo fácil | Pedir el nombre: 65%. «¿En qué área trabajas?»: 34% (75% de los calientes). «¿Te muestro las facilidades?»: 28%. |
| Prueba natural del 30 de octubre | En Negativo, la pregunta corta superó al audio + imagen + link: 6.5% contra 4.2% (en calientes, 17.6% contra 10.7%). |
| Las ofertas no funcionan | Los toques de información y oferta de Negativo contestan entre 0% y 5%. Los botones de oferta se pulsan entre 1% y 3%. |
| Las ofertas abaratan el precio | Circularon seis precios: $3,999, $3,799, $3,399, $2,799, $2,399 y $999 al mes. |
| A los fríos casi nada los reactiva | Alrededor de 2%, con o sin oferta. |
| El seguimiento del mismo día es el que rescata | Con el lead de 2 a 24 h sin escribir, el mensaje de una persona rescata 24%. Después de 24 h, 8%. |
| Estilo que contesta más | Corto (46% contra 39% del largo), sin link (46% contra 29%), una sola pregunta y el nombre del lead. El audio no le gana al texto. |
| «Inge» | El bot pone «Inge» como nombre cuando el lead no da el suyo, y el equipo lo copió (más de 1,400 envíos). |
| Error del bot actual | El 66% vuelve a escribir después de la recomendación, pero el bot pasa a Negativo al 55% de ellos, 4 h después de su último mensaje. |

«Contestó» = el lead escribió después del mensaje y antes del siguiente envío.

Detalle completo en `mensajes-16oct-5nov/` y `audios-paso-1.2/`.

---

## 3. El CRM por dentro

**URL:** https://crm-web-production-3b33.up.railway.app/

**Sesión.** Se inicia con `POST /auth/login`, que deja una cookie de sesión, y se verifica con `GET /auth/yo`. El horario de los bots es de 9:00 a 21:00 h, zona America/Monterrey (`GET /ajustes/horario-bots`).

### 3.1 Embudos y etapas

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

### 3.2 La secuencia (el bot de una etapa)

- **Leer:** `GET /etapas/:etapaId/secuencia`.
- **Guardar:** `PUT /etapas/:etapaId/secuencia`. Reemplaza la secuencia completa.
- **Borrar:** `DELETE /etapas/:etapaId/secuencia`.

Cuerpo del `PUT` (así lo manda la página):

```json
{
  "activa": true,
  "detenerAlResponder": false,
  "soloEnHorario": false,
  "pasos": [
    { "clave": "saludo", "tipo": "mensaje", "config": { "texto": "Hola…" } }
  ]
}
```

Opciones de la secuencia:

| Opción | Qué hace |
|---|---|
| `activa` | Enciende o apaga el bot de la etapa. |
| `detenerAlResponder` | Detiene el bot cuando el cliente escribe. Hoy está en `false` en todas las etapas. |
| `soloEnHorario` | Solo envía de 9 a 21 h. Hoy está activa en Negativo. |
| `esperasEnHorario` | Aparece en los datos guardados (por ejemplo, 1.2, 1.3 y 1.4) pero no en el cuerpo que manda la página. Antes de usarla, verifica si el `PUT` la acepta. |

Cada paso tiene `clave` (su nombre, sirve para saltar a él), `tipo` y `config`:

| `tipo` | `config` | Qué hace |
|---|---|---|
| `mensaje` | `{texto}` · `{texto, archivoId}` · `{texto, plantilla:{idioma:"es", nombre:"<plantilla_meta>"}}` | Manda texto, un archivo o una plantilla de Meta. |
| `pausa` | `{segundos}` | Espera antes del siguiente paso. |
| `esperar` | `{segundos, siResponde, siNoResponde, siRespondePaso?, siNoRespondePaso?, siRespondeEtapaId?, siNoRespondeEtapaId?}` | Espera a que el cliente escriba. Cada rama puede: `"continuar"`, `"detener"`, saltar a un paso (`…Paso: "<clave>"`) o mover a una etapa (`…EtapaId`). |
| `condicion` | `{campo, operador, valor, siCumple:{accion:"continuar"\|"ir_a", paso}, siNoCumple:{…}}` | Compara un campo. Operadores: `igual`, `distinto`, `contiene`, `no_contiene`, `vacio`, `no_vacio`, `mayor`, `menor`. |
| `ir_a` | `{paso}` (verificar) | Salta a otro paso del mismo bot. |
| `establecer_campo` | `{campo, valor}` | Guarda un valor en un campo de la conversación o cambia el nombre del cliente. |
| `cambiar_etapa` | `{etapaId}` | Mueve la conversación y arranca el bot de esa etapa. |
| `asignar` | `{}` (verificar opciones) | Deja la conversación con una persona. |
| `tarea` | `{tipo:"Seguimiento", texto, plazoSegundos, asignarA:"responsable"}` | Crea una tarea con fecha límite. |
| `nota` | `{texto}` | Nota interna en el hilo; el cliente no la ve. |
| `reaccion` | `{}` | Pone un corazón al último mensaje del cliente. |
| `detener` | `{}` | Termina el bot. |

**Variables en textos.** `{{nombre}}` es el nombre del cliente. `{{numero}}` se usa en el link de la ruta, por ejemplo `https://academy.dpsys.com.mx/ruta-iso/{{numero}}`.

**Campos de la conversación (para `condicion` y `establecer_campo`).**

- **Del sistema:**
  - `nombre`: se puede escribir;
  - `mensaje`: lo último que escribió el cliente;
  - `etapa`;
  - `anuncio` y `anuncio_id`;
  - `fuente`: ADS o SHORTLINK;
  - `ref`;
  - `utm_*`.
- **Personalizados:** `Paso del negativo` (hoy es el contador de rondas), `Curso de interes`, `Area de trabajo`, `Modalidad`, `Forma de pago`, `Proxima cita` y `Origen`.
- **Campos nuevos:** se pueden escribir libremente con `establecer_campo` (verifica que se guarden). Este rediseño agrega `Temperatura` y `Paso del seguimiento`.

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

### 3.3 Otras llamadas útiles

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

## 4. El bot actual (As Is)

Los tres embudos tienen la misma estructura. Cambia el número de certificaciones y el link de la ruta (`ruta-iso`, `ruta-manufactura`, `ruta-core-tools`).

| Etapa | Qué hace hoy | Respuesta | Veredicto |
|---|---|---|---|
| **1 Saludo** | Saluda («¡Hola excelente día Inge👋! Te saluda *Salma Pérez* de SyS») y pide el nombre. Espera 30 min. **Si contesta:** reacciona y se detiene. **Si no:** manda «Hola Inge, no te preocupes…», pone `nombre = "Inge"` y pasa a 1.1. | Pedir el nombre: 65%. «No te preocupes»: 0% en fríos. | Conservar la pregunta. **Quitar «Inge».** |
| **1.1 Informes** | Explica el programa: «Te explico rapidito… son 9 certificaciones…» y pasa a 1.2. | 55% escribe en 24 h; 31% abre la ruta. | Acortar. |
| **1.2 Lista de cursos** | Manda un archivo con las certificaciones y el costo total, el link al temario y cómo funciona la membresía. A los 2 min pregunta «¿en qué área trabajas?». **A las 2 h lo pasa a Negativo, aunque haya contestado.** | Área: 34% (75% de los calientes). | Conservar la pregunta. **Cambiar el paso a Negativo por la clasificación.** |
| **1 Negativo** (40 pasos, en horario) | Contador `Paso del negativo` con 4 rondas: (1) «¿Tuviste oportunidad de revisar la info?»; (2) clase demo; (3) 64 certificaciones en 4 plantillas y oferta relámpago de $3,799 con botones; (4) CV, «nos quedan 4 lugares… $2,799» y «la cerramos hoy». Luego pasa a Perdido. | Ronda 1: 6.5%. Ofertas e información: entre 0% y 5%. | Conservar solo la ronda 1. **Quitar las ofertas, la urgencia y el $2,799.** |
| **1.3 Llamadita** | A los 5 min: «¿te hago una llamadita?». A los 10 min: «tenemos facilidades de pago, ¿quieres que te muestre…?». A las 4 h pasa a Negativo. | 28% a 29%. | Conservar los textos; cambiar el paso final. |
| **1.4 Facilidades** | «Manejamos 3 facilidades…» y «¿Cuál de estos 3 te interesa más?». A las 4 h pasa a Negativo. | Pocos envíos, respuesta alta. | Actualizar a 45 días en quincenas. |
| **2 Parcialidades** | «Te comparto el desglose…» y medios de pago. A las 4 h pasa a Negativo. | — | Actualizar a 45 días y quincenas. |
| **MSI 2799** / **2. MSI 2799** | Pago a meses con el precio de $2,799. | — | Apagar (no borrar). |
| **3 Transferencia / PayPal / Débito** | Datos y pasos de pago. En Manufactura usa las plantillas `api_2_50_cert_*` y `api_2_segumiento_*`. | — | Revisar que no tengan precio rebajado ni urgencia. |
| **STBY clientes con interés** (Core Tools) | Crea una tarea: «ofrecer una oferta súper accesible… $1,500 (o $1,000 con 3 cursos)». | — | Contradice el precio único: lo decide Dirección. |
| **Ganado** | Bienvenida, correo de acceso y nota de pago. | — | Conservar. |

---

## 5. El bot nuevo (To Be)

### 5.1 La regla de clasificación

- **Caliente:** en sus primeras 24 h escribió algo más que su nombre. En la práctica, **contestó la pregunta del área (1.2) o cualquier mensaje posterior**.
- **Frío:** en sus primeras 24 h no contestó, o solo dio su nombre.
- **Caliente desde el minuto cero:** el lead que escribe su propio primer mensaje en lugar del texto automático del anuncio.

Se guarda en un campo nuevo, `Temperatura`, con valor `Caliente` o `Frío`.

**Qué recibe cada uno:**

| | Frío | Caliente |
|---|---|---|
| Quién lo lleva | Solo el bot | Una persona, que contesta en 5 min o menos |
| Mensajes | 2 plantillas de Meta como máximo | Ruta personalizada, audio de 45 s o menos y «¿Qué te parece?» |
| Precio u ofertas | Nunca | Solo $3,999 y las formas de pago |
| Si se queda callado | Pasa a Perdido | Seguimiento con plantillas sin oferta |

**Si un frío escribe en cualquier momento,** pasa a `Caliente` y se asigna a una persona.

### 5.2 Cambios etapa por etapa

Aplícalos igual en los tres embudos, cambiando el número de certificaciones y el link de la ruta.

#### 1 Saludo

- Quitar «Inge» del saludo:
  > ¡Hola! 👋 Te saluda {firma del bot} de *Desarrollo Profesional SyS*. Con gusto te comparto la información de los cursos.

  Hoy firma «Salma Pérez». El usuario decide si se mantiene esa firma.
- Conservar: «Para continuar, ¿me compartes tu nombre? 🙌» y la espera de 30 min.
- En la rama sin respuesta:
  - **borrar el paso `establecer_campo nombre = "Inge"`**;
  - texto nuevo: «No te preocupes, igual te comparto la información por si te interesa.»
- **Verificar con el usuario:** cuando el lead da su nombre, el bot reacciona y se detiene (`detener`). ¿Quién lo pasa a 1.1? En los datos, 1.1 llegó a 733 leads. Si nadie lo hace a mano, agregar `cambiar_etapa → 1.1` después de la reacción.
- **Opcional, caliente desde el minuto cero:** al inicio, una `condicion` sobre `mensaje` que compare contra el texto automático de los anuncios de ese embudo. Si no es el texto del anuncio, entonces:
  - `establecer_campo Temperatura = Caliente`;
  - `asignar`;
  - `nota`: «Escribió su propia pregunta: contestarla primero (plantilla A05)».

  Pide al usuario los textos automáticos de cada anuncio.

#### 1.1 Informes

Acortar a un solo mensaje:

> ¡Excelente, {{nombre}}! Gracias por tu interés 🙌 Tu programa *ISO + Calidad* son *9 certificaciones* y cada una incluye su diploma y su constancia *DC-3 avalada por la STPS*, sin costo extra. Además, con tu membresía tienes acceso a los 64 cursos del catálogo durante 12 meses.

- Usar 6 certificaciones en Manufactura y Calidad y 8 en Core Tools Premium.
- **Si `nombre` puede venir vacío:** `condicion nombre vacio` que salte a una versión sin nombre («¡Excelente! Gracias por tu interés…»). Al quitar «Inge», verifica en la prueba qué valor trae `nombre`; puede ser el nombre del perfil de WhatsApp.

#### 1.2 Lista de cursos (aquí se clasifica)

1. `mensaje` con archivo y link:
   > Aquí puedes ver tus *9 certificaciones*, cuánto dura cada una y qué documento te llevas 👇
   > https://academy.dpsys.com.mx/ruta-iso/{{numero}}

   Decidir con el usuario si el archivo sigue mostrando el «costo total». Ancla un precio alto, pero puede servir como comparación.
2. `pausa` de 60 s.
3. `mensaje`:
   > Solo una pregunta, {{nombre}}: ¿en qué área trabajas o qué estudias? Así te recomiendo los cursos que más te van a servir.
4. `esperar` 79,200 s (22 h, para que el total desde la entrada sea cerca de 24 h). Debe correr en tiempo real, no solo en horario.
   - **Si responde** (`siRespondePaso: "caliente"`):
     - `establecer_campo Temperatura = Caliente`;
     - `asignar`;
     - `nota`: «Caliente: mandar ruta personalizada + audio de 45 s o menos + "¿Qué te parece tu ruta?" en menos de 5 min (A01 a A03)»;
     - `tarea`: «Si no contestó en 24 h, moverlo a "Seguimiento calientes"», con `plazoSegundos: 86400` y `asignarA: "responsable"`;
     - `detener`.
   - **Si no responde:**
     - `establecer_campo Temperatura = Frío`;
     - `cambiar_etapa → Fríos` (etapa nueva).
5. **Quitar** la pausa de 2 h y el `cambiar_etapa → Negativo`. Es el error que hoy manda a Negativo a leads que sí contestaron.

#### Fríos (etapa nueva)

- **Dónde va:** después de 1.2.
- **Configuración:** `soloEnHorario: true`.
- **Pasos:**
  1. `pausa` de 1 a 2 días, para que el primer envío caiga a los 2 o 3 días de la entrada.
  2. `mensaje` con la plantilla de Meta **`sys_frio_ruta`** (F02):
     > Hola, {{nombre}}. ¿Sigues buscando certificarte en {tema}? Respóndeme «Sí» y te preparo una ruta según tu área.
  3. `esperar` 4 días. Si responde, salta a `reactivo`.
  4. `mensaje` con la plantilla **`sys_frio_cierre`** (F03):
     > Hola, {{nombre}}. Te dejo la puerta abierta: cuando quieras retomar, escríbeme «Info» y con gusto te ayudo.
  5. `esperar` 3 días. Si responde, salta a `reactivo`.
  6. `cambiar_etapa → Perdido`, con la razón «No contestó» si la razón se puede poner desde el bot.
  7. **`reactivo`:**
     - `establecer_campo Temperatura = Caliente`;
     - `asignar`;
     - `nota`: «Frío que regresó: contestar en menos de 5 min»;
     - `detener`.
- **Sin precio, sin ofertas y sin botones de oferta.**

#### Seguimiento calientes (en lugar de «1 Negativo»)

- **Recomendación:** renombrar la etapa Negativo con `PATCH /etapas/:id` para conservar su historial, y reemplazar su secuencia completa.
- **Configuración:** `soloEnHorario: true`.
- **Patrón:** el mismo del contador actual, con el campo `Paso del seguimiento`. Así, si el lead vuelve a caer en la etapa, sigue en la siguiente ronda.

| Ronda | Cuándo (desde que dejó de escribir) | Plantilla de Meta | Texto |
|---|---|---|---|
| 1 | 24 a 48 h | `sys_seguimiento_ruta` (E01) | Hola, {{nombre}}. Pasaba a saber si pudiste revisar la ruta que te preparé. ¿Te quedó alguna duda? |
| 2 | 48 a 72 h, por la mañana | `sys_reactivacion_ruta` (E02) | Hola, {{nombre}} 😊 Te escribo por tu ruta de certificaciones en {tema}. ¿Prefieres que te resuelva dudas por aquí o que te comparta las formas de pago? |
| 3 | 4 a 5 días | `sys_apartado_quincenas` (E03) | Hola, {{nombre}}. Por si te sirve: puedes empezar tu membresía con un apartado de $1,000 y cubrir el resto en tus próximas dos quincenas. ¿Te explico cómo quedaría? |
| 4 | 7 días | `sys_interes_7_dias` (E04) | Hola, {{nombre}}. ¿Sigue en pie tu interés en certificarte en {tema}? Si ahora no es buen momento, dime y te escribo más adelante. |
| 5 | 10 a 15 días | `sys_despedida` (E07) | Hola, {{nombre}}. No quiero llenarte de mensajes. Si más adelante quieres retomar tu certificación, escríbeme y con gusto te ayudo. |
| Fin | 3 días después de la ronda 5 | — | `cambiar_etapa → Perdido` |

- **Entre rondas:** un `esperar` con la duración correspondiente. Si responde, salta a `retomo`:
  - `asignar`;
  - `nota`: «Regresó: contestar en menos de 5 min»;
  - `detener`.
- **Se quitan:**
  - la clase demo como seguimiento (se manda solo si el lead la pide);
  - las 4 plantillas de las 64 certificaciones;
  - la oferta relámpago de $3,799;
  - el CV;
  - «nos quedan 4 lugares… $2,799»;
  - «la cerramos hoy».

#### 1.3 Llamadita y facilidades de pago

- Conservar los dos textos; funcionan (28% a 29%).
- Cambiar la pausa de 4 h y el paso a Negativo por:
  - `esperar` 24 h;
  - si responde, `detener` (la atiende una persona);
  - si no responde, `cambiar_etapa → Seguimiento calientes`.

#### 1.4 Facilidades de pago

Texto nuevo, un solo mensaje:

> Estas son tus 3 opciones para la membresía de $3,999:
> 1. *Pago completo:* transferencia, depósito, PayPal o tarjeta.
> 2. *Pago en partes:* apartas con $1,000 y cubres el resto en 2 abonos de $1,499.50 en tus próximas dos quincenas (hasta 45 días).
> 3. *Meses sin intereses:* 3, 6, 9 o 12 meses con tarjeta de crédito.
>
> Tus accesos se activan desde tu primer pago. ¿Cuál te acomoda más, {{nombre}}?

Después: `esperar` 24 h. Si responde, `detener`. Si no responde, `cambiar_etapa → Seguimiento calientes`.

#### 2 Parcialidades

Primer mensaje nuevo:

> ¡Excelente, {{nombre}}! Así funciona el pago en partes: apartas con $1,000 (tus accesos se activan ese día) y cubres el resto en 2 abonos de $1,499.50 en tus próximas dos quincenas, hasta 45 días. En un momento te comparto las fechas exactas.

- Conservar el mensaje de medios de pago.
- Cambiar el paso final a: `esperar` 24 h; si no responde, `cambiar_etapa → Seguimiento calientes`.
- Las fechas exactas las manda la persona con la calculadora (plantilla C03). Regla propuesta: los abonos caen en las dos últimas quincenas (día 15 o fin de mes) dentro de los 45 días.

#### Otras etapas

| Etapa | Qué hacer |
|---|---|
| MSI 2799 / 2. MSI 2799 | `activa: false`. No borrar la etapa. |
| 3 Transferencia / PayPal / Débito | Revisar los textos y las plantillas `api_2_*`. Quitar precios distintos de $3,999 y la urgencia. Los datos bancarios: solo los oficiales que dé el usuario. |
| STBY clientes con interés (Core Tools) | La tarea de la oferta de $1,500 la decide Dirección. |
| Ganado | Conservar. Opcional: agregar «Tu DC-3 y tu diploma ya vienen incluidos en tu membresía». |

### 5.3 Reglas de estilo para cualquier texto nuevo

- Una sola pregunta, al final.
- Corto: hasta 160 caracteres cuando se puede.
- Usar `{{nombre}}`; nunca «Inge».
- Un emoji como máximo.
- Sin links salvo el de la ruta.
- Un solo precio: $3,999.
- Sin urgencia ni escasez («solo por hoy», «quedan X lugares», «la cerramos hoy»).
- Decir siempre que la DC-3 y el diploma ya vienen incluidos.
- Textos neutros, que sirvan igual para asesoras y asesores.
- Fuera de 24 h, solo plantillas de Meta y sin fechas exactas.

### 5.4 Plantillas de Meta que hay que crear

Se dan de alta y se aprueban en Meta antes de usarlas en el bot. Confírmalas con `GET /whatsapp/plantillas-meta`.

**Variables.** En Meta son `{{1}}` y `{{2}}`; el CRM las llena desde el texto, por ejemplo `{{nombre}}`. Antes de crearlas, revisa cómo lo hace una plantilla actual, como `i_c_negativo_2_64_cert_63kkgk` («Que onda {{nombre}}…»).

**Texto de los pasos.** Al usar una plantilla en un paso, `texto` debe ser el texto de la plantilla.

| Nombre sugerido | Categoría | Uso |
|---|---|---|
| `sys_seguimiento_ruta` | Marketing | Calientes, ronda 1 |
| `sys_reactivacion_ruta` | Marketing | Calientes, ronda 2 (botones opcionales: «Tengo dudas», «Formas de pago», «Ahora no») |
| `sys_apartado_quincenas` | Marketing | Calientes, ronda 3 |
| `sys_interes_7_dias` | Marketing | Calientes, ronda 4 |
| `sys_despedida` | Marketing | Calientes, ronda 5 |
| `sys_frio_ruta` | Marketing | Fríos, envío 1 |
| `sys_frio_cierre` | Marketing | Fríos, envío 2 |
| `sys_pago_en_partes` | Marketing | Persona, fuera de 24 h |
| `sys_quincena` | Marketing | Persona: el lead dijo «en la quincena» |
| `sys_inscripcion_pendiente` | Marketing | Persona: pidió datos de pago y no pagó |
| `sys_recordatorio_abono` | Utilidad | Persona: 1 o 2 días antes de la quincena del abono |

Los textos exactos están en `plantillas-asesores/SyS_Plantillas_de_seguimiento.xlsx`, hoja «Plantillas» (IDs C04, C15, E01 a E07, F02 y F03).

---

## 6. Orden de implementación

Cada fase necesita la aprobación del usuario antes de guardar.

1. **Fase 0. Respaldo e inventario.**
   - `GET` de la secuencia y los disparadores de todas las etapas de los tres embudos. Guardarlos en `rediseno-bot/respaldo/<embudo>/<etapa>.json` (sin datos de leads).
   - `GET /whatsapp/plantillas-meta` para ver qué plantillas existen y están aprobadas.
2. **Fase 1. Cambios rápidos y de bajo riesgo.**
   - Quitar «Inge» en Saludo.
   - Actualizar los textos de 1.4 y 2 Parcialidades a 45 días.
   - Apagar MSI 2799.
   - Quitar de Negativo las rondas 2 a 4: dejar solo la ronda 1 y, si no responde en 3 días, pasar a Perdido.
3. **Fase 2. Clasificación.**
   - Campo `Temperatura`.
   - Cambio de 1.2.
   - Etapa nueva Fríos, al principio con F02 y F03 solo cuando las plantillas estén aprobadas.
   - Mientras tanto, Fríos solo marca el campo y pasa a Perdido a los 7 días.
4. **Fase 3. Seguimiento de calientes.**
   - Renombrar Negativo a «Seguimiento calientes» con las 5 rondas.
   - Cambiar el paso final de 1.3, 1.4 y 2 Parcialidades.
5. **Fase 4. Personas (fuera del bot).**
   - Ruta personalizada y audio de 45 s o menos.
   - Libro de plantillas y calculadora para el equipo.

### Pruebas (en un embudo duplicado o con un número de prueba)

| Caso | Resultado esperado |
|---|---|
| No contesta nada | Termina en Fríos con `Temperatura = Frío`; recibe F02 y F03 y pasa a Perdido. |
| Solo da su nombre | Igual que el caso anterior. |
| Da su nombre y su área | `Temperatura = Caliente`, asignado a una persona, con la nota y la tarea, sin pasar a Negativo. |
| Escribe su propia pregunta al entrar | Caliente desde el inicio, si se implementó la condición. |
| Frío que responde a F02 | Pasa a caliente y se asigna. |
| Caliente que se calla después de 1.4 | Pasa a Seguimiento calientes y recibe E01. |
| Responde en cualquier ronda | Se asigna y el bot se detiene. |
| Envío fuera de 24 h sin plantilla | Debe aparecer `ventana_cerrada` en la corrida. Si aparece, corregir el paso. |

Revisa cada corrida con `GET /conversaciones/:id/secuencia` y los movimientos con `GET /conversaciones/:id/movimientos`.

**Rollback:** `PUT /etapas/:id/secuencia` con el respaldo de la Fase 0.

---

## 7. Pendientes por confirmar con el usuario o con Dirección

1. ¿Quién pasa a 1.1 al lead que sí da su nombre? Hoy el bot se detiene.
2. La firma del saludo: «Salma Pérez», un nombre genérico o el del asesor asignado.
3. Los textos automáticos de los anuncios, para detectar al lead caliente desde el minuto cero.
4. Si el archivo de 1.2 sigue mostrando el «costo total» de la ruta.
5. La regla de fechas de los abonos (las dos últimas quincenas dentro de los 45 días).
6. Los datos bancarios oficiales y la regla de factura.
7. La tarea de STBY con la oferta de $1,500.
8. El alta de las plantillas de Meta: nombres, categoría y aprobación.
9. Renombrar Negativo o crear etapas nuevas. Renombrar conserva el historial; crear nuevas deja limpio el reporte.

---

## 8. Cómo medir después

Usar la misma metodología de `mensajes-16oct-5nov/` sobre una tercera muestra y compararla contra las dos anteriores:

- % de fríos y calientes, y ventas de cada grupo;
- respuesta a la pregunta del área y a cada ronda de seguimiento;
- conversión de calientes;
- leads calientes que el bot movió por error a seguimiento (debe ser 0);
- plantillas de Meta enviadas a fríos (antes: 1,588 envíos de ofertas a fríos en el periodo);
- tiempo de respuesta de las personas a los calientes (meta: 5 min o menos).

---

## 9. Archivos de referencia en este repositorio

| Carpeta | Contenido |
|---|---|
| `CONTEXTO_Y_PLAN.md` | El mismo contexto en versión para personas |
| `as-is-3-embudos/` | Diagnóstico del 5 al 15 de octubre |
| `audios-paso-1.2/` | Tiempos y audios de la recomendación |
| `propuesta-clasificacion/` | Propuesta aceptada por Dirección (Word) |
| `mensajes-16oct-5nov/` | Medición de toques, estilo, asesores, dudas y puntos a corregir |
| `plantillas-asesores/` | Guía de estilo, 57 plantillas pulidas y calculadora de pagos |
