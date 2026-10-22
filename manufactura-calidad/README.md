# Bot de WhatsApp · Embudo Manufactura y Calidad

| Archivo | Contenido |
|---|---|
| `rediseno-bot-manufactura.html` | **Versión 2 del bot.** Árbol de decisión (bot y asesor, dentro y fuera de horario), el cuerpo y el tiempo de cada mensaje, plantillas de Meta rediseñadas, respuestas rápidas, guion del asesor y receta de configuración por etapa. |
| `analisis-base-5-12-oct.html` | Análisis base de la semana del 5 al 12 de octubre de 2026: 74 leads y 2,215 mensajes. |

## Versiones editables

La edición de los mensajes se hace en el chat; el bot y el árbol de decisión también están en dos documentos aparte. Los tres usan los mismos IDs de mensaje:

- [Chat Manufactura y Calidad](https://claude.ai/artifact/8YjnVue58feVScUBv5Pq5C) (`chat-bot-editable.html`): los 36 mensajes como conversación de WhatsApp. Cada mensaje muestra su paso, cuándo sale, de dónde viene la decisión, la espera y qué pasa si el cliente responde o no. Todo se edita en el mismo chat y se guarda solo.

- [Bot Manufactura y Calidad · Mensajes y tiempos](https://claude.ai/code/artifact/1038e24c-2194-4ac1-99a9-15a13cda525e): los 36 mensajes con su texto, botones, espera, condición y estado de revisión, además de FAQ, objeciones, plantillas de Meta, respuestas rápidas y configuración por etapa.
- [Bot Manufactura y Calidad · Árbol de decisión](https://claude.ai/code/artifact/3b3b1835-fa39-4b66-81b2-aca7468d8ce0): los árboles A (primer contacto), B (pago y cierre) y C (seguimiento y salida), y la tabla de 43 transiciones.

## Horario

| | Lunes a viernes | Sábado | Domingo |
|---|---|---|---|
| Atención (asesores) | 7:00–22:00 | 8:00–22:00 | 7:00–22:00 |
| Seguimientos automáticos | 8:30–21:00 | 9:00–21:00 | 9:30–20:00 (1 como máximo) |
| Respuesta del bot a quien escribe | 24 h | 24 h | 24 h |

De noche, el bot responde de forma breve.

## Cifras clave de la versión 2

- **Primer contacto:** 3 mensajes y 523 caracteres. Hoy son 8 mensajes y 1,585 caracteres.
- **Seguimiento:** 5 toques, uno por día como máximo. Los primeros cuatro caen dentro de las 72 h sin costo del anuncio. Hoy son 14 mensajes en 112 h.
- **Plantillas de Meta:** 11 nuevas, validadas contra las reglas de Meta. Reemplazan las 13 que usa hoy el bot.

Los datos del CRM se consultaron en modo de solo lectura; no se modificó nada. Por privacidad, los leads se citan solo por su número en el CRM.
