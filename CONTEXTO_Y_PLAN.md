# Contexto del proyecto y lo que sigue

**Desarrollo Profesional SyS · eje Cursos**
Embudos: ISO + Calidad, Manufactura y Calidad, Core Tools Premium
Actualizado con datos al 5 de noviembre de 2026.

---

## 1. Contexto

### Qué se vende

Una membresía de **$3,999** con **64 cursos en línea durante 12 meses**. Cada curso incluye su **DC-3 avalada por la STPS** y su diploma, sin costo extra.

### Cómo llegan y se atienden los leads

1. El lead llega por un anuncio a WhatsApp y entra a uno de los tres embudos del CRM.
2. Un **bot** lo saluda, le pide su nombre y su área, y después le manda seguimientos y ofertas.
3. Los **asesores** (Salma, Alexander, Victoria y Joceline):
   - dan la recomendación con un audio;
   - resuelven dudas;
   - cierran el pago.

### El problema

- **La mitad de los leads nunca conversa.** El 54% es frío: en 24 h no contestó o solo dio su nombre. Dejaron 2 de las 37 ventas. Aun así reciben el mismo seguimiento, ofertas y plantillas de Meta, que cuestan.
- **Las ofertas no funcionan y abaratan el precio.**
  - Contestan entre 0% y 5%.
  - Sus botones se pulsan entre 1% y 3% de las veces.
  - Circularon seis precios distintos de la misma membresía: $3,999, $3,799, $3,399, $2,799, $2,399 y $999 al mes.
  - El lead se queda con $2,799 en vez de $3,999.
- **Cada asesor escribe a su manera.** Hay mensajes que funcionan muy bien y otros que casi nadie contesta, y no hay un estándar.

---

## 2. Lo que ya se hizo

Todo se hizo leyendo el CRM en modo solo lectura, sin mover nada del proceso.

| # | Entregable | Carpeta | Qué contiene |
|---|---|---|---|
| 1 | Diagnóstico As Is (5 al 15 oct) | `as-is-3-embudos/` | Un libro por embudo y un consolidado |
| 2 | Audios del paso 1.2 | `audios-paso-1.2/` | Tiempo a la recomendación, uso del audio y qué pasa después |
| 3 | Propuesta para Dirección (Word) | `propuesta-clasificacion/` | Clasificar leads, ruta personalizada con audio de 45 s o menos y plantillas de Meta pulidas. **Aceptada.** |
| 4 | Medición de mensajes (16 oct al 5 nov) | `mensajes-16oct-5nov/` | Toques del bot, estilo de escritura, reactivación, análisis por asesor, dudas y objeciones, y puntos a corregir |
| 5 | Plantillas para asesores | `plantillas-asesores/` | Guía de estilo, 57 plantillas pulidas y calculadora de pagos a 45 días en quincenas |

### Hallazgos principales

- **Salma es la que más vende.** Sus leads hicieron 26 de las 37 ventas y convierte el 10% de sus calientes. El resto del equipo está entre 3% y 5%.
- **El mejor seguimiento es el del mismo día.** Cuando el lead lleva de 2 a 24 h sin escribir, el seguimiento rescata hasta 30%. Después de 24 h, ningún asesor pasa de 10%.
- **Contestan los mensajes cortos que piden algo fácil:**
  - «¿Qué te parece?»: 69%.
  - Pedir nombre completo, correo y teléfono: 75%.
  - «¿Cuál de estas te interesa?»: 46%.
- **Quien escribe su propia pregunta al entrar** es el 7% de los leads e hizo 18 de las 37 ventas.
- **La certificación incluida casi no se menciona.** Casi ningún mensaje dice que la DC-3 ya viene incluida en la membresía.
- **«En la quincena» se pierde.** 19 leads dijeron «en la quincena» o «más adelante» y ninguno compró.

---

## 3. Lo que sigue

El detalle técnico para hacerlo dentro del CRM está en `CLAUDE.md`.

### 3.1 Rediseñar el bot con dos clases de lead

- **Horario de atención: de 7:00 a 22:00 h.** Fuera de ese horario no sale ningún mensaje del CRM. La única excepción es la respuesta inmediata a quien escribe de noche: recibe la información básica y el aviso del horario.
- **El bot se presenta como «el asistente de Desarrollo Profesional SyS».** No usa el nombre de una persona, para distinguirse del asesor.
- **No se pide el nombre para dar la información.** La bienvenida trae los botones «Más información» y «Solo el precio». Con el primero, el bot manda los beneficios, el costo y el flyer inicial.
- **Dos clasificaciones dentro de cada embudo: Caliente y Frío.**
  - **Caliente:** toca «Más información», escribe algo o sigue después del precio. Lo atiende un asesor.
  - **Frío:** no contesta en 24 h, o recibe el precio y ya no sigue. Recibe 2 plantillas como máximo, sin precio, y pasa a Perdido.
  - Preguntar el precio no hace frío a nadie: de quienes preguntaron el costo, 19% compró.
- **Toda rama de botones trata el texto libre igual que el botón positivo.** Los botones casi no se pulsan; el lead suele contestar con sus propias palabras.

### 3.2 Simplificar los pasos del embudo

| Etapa | Cambio |
|---|---|
| 1 Saludo | Pasa a ser Bienvenida con botones, sin «Inge» ni la firma de una persona. |
| 1.1 y 1.2 | Su contenido pasa a la bienvenida. Las etapas se quedan, con el bot apagado. |
| 1.4 Facilidades | Botones a cada forma de pago, con 45 días en quincenas. |
| 1.3 Llamada | Ya no sale sola a media conversación. Se ofrece cuando el lead duda o está por decidir, junto con seguir por chat. Puede ser el cierre de la venta. |
| 1 Negativo | Pasa a ser Seguimiento calientes: 5 plantillas en unos 15 días, sin ofertas ni urgencia. |
| Ofertas de $3,799 y $2,799 | No se borran. Se quedan en el embudo y el flujo normal se las salta. Solo se usan con oferta autorizada. |

Todos los textos van con un solo tono: trato de tú, neutral, sin modismos ni rigidez, una pregunta y un emoji como máximo.

### 3.3 Ruta en PDF y audio corto

- Reemplazan el audio de 2 minutos y los links de las rutas.
- Los manda el asesor, sin guion.
- El módulo vive en el sistema de ventas y se trabaja aparte.

### 3.4 Homologar al equipo con el libro de plantillas

Aplica a todos los asesores y auxiliares:

- Un solo precio: **$3,999**. La facilidad es pagar en partes, no el descuento.
- **Pago en partes:** $1,000 de apartado y 2 abonos de $1,499.50 en quincena, **hasta 45 días**.
- Decir siempre que la **DC-3 y el diploma ya vienen incluidos** en la membresía.
- **Una sola pregunta por mensaje**, corto y sin link salvo que el lead lo pida.
- Usar el **nombre del lead** en vez de «Inge».
- Un emoji como máximo.
- Sin urgencia falsa.
- Textos neutros, que sirvan igual para asesoras y asesores.
- **Seguimiento el mismo día**, de 2 a 4 h después de que el lead deja de contestar.
- **Solo de 7:00 a 22:00 h.** El asesor se presenta con su nombre para distinguirse del bot.

### 3.5 Dar de alta en Meta las plantillas para fuera de las 24 h

Son las plantillas para reactivar calientes, para fríos, para pago en partes y para recordatorio de abono. **No llevan fechas, solo estimaciones** como «en tus próximas dos quincenas».

Tiempos de reactivación para calientes:

| Momento | Plantilla |
|---|---|
| 24 a 48 h | E01 |
| 48 a 72 h, por la mañana | E02 |
| 4 a 5 días | E03 |
| 7 días | E04 |
| 10 a 15 días (despedida) | E07 |

### 3.6 Confirmar con Dirección

- **Fechas de los abonos.** La regla propuesta: las dos últimas quincenas (día 15 o fin de mes) dentro de los 45 días.
- **Pago y factura.** Los datos bancarios oficiales y la política de factura.
- **Certificación internacional.** Cómo explicar el examen de las certificadoras internacionales sin contradecir que la certificación ya viene incluida.

### 3.7 Medir otra vez

Tomar una **tercera muestra** y compararla contra las dos anteriores para ver si:

- sube la respuesta a los seguimientos;
- sube la conversión de los calientes;
- baja el gasto en plantillas para fríos.

---

*Datos del CRM en solo lectura. Sin nombres, teléfonos ni textos de los leads.*
