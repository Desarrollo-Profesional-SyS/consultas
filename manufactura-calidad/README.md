# Bot de WhatsApp · Embudo Manufactura y Calidad

| Archivo | Contenido |
|---|---|
| `rediseno-bot-manufactura.html` | **Versión 2 del bot.** Árbol de decisión (bot y asesor, dentro y fuera de horario), el cuerpo y el tiempo de cada mensaje, plantillas de Meta rediseñadas, respuestas rápidas, guion del asesor y receta de configuración por etapa. |
| `analisis-base-5-12-oct.html` | Análisis base de la semana del 5 al 12 de octubre de 2026: 74 leads y 2,215 mensajes. |

## Versiones editables (versión 4)

La versión 4 sigue el filtro de intención de B3 («Hablar con asesor», «Quiero saber más», «Solo explorando»). El lead caliente pasa al asesor después de C1 y el bot deja de enviarle mensajes de venta. El asesor trabaja con un guion de 5 etapas:

- **3.1 · Contacto y perfil:** saludo y ocupación en 5 min o menos.
- **3.2 · Ruta y audio:** ruta inicial (obligatoria), audio persuasivo de 1 minuto como máximo y ruta final (opcional).
- **3.3 · Dudas:** 10 plantillas cortas (D1 a D10) para asesores y auxiliares, que sustituyen unas 20 del CRM.
- **3.4 · Cierre:** ver los pagos o una llamada de 5 minutos.
- **3.5 · Seguimiento personalizado:** 4 toques en 6 días.

El seguimiento automático queda solo para tibios, fríos y quien no contesta el filtro. Los IDs de los mensajes son los mismos en el chat y en el árbol:

- [Chat Manufactura y Calidad](https://claude.ai/artifact/8YjnVue58feVScUBv5Pq5C) (`chat-bot-editable.html`): 60 mensajes como conversación de WhatsApp, en 16 etapas, más 10 de versiones anteriores en «Archivo». Cada mensaje muestra su paso, cuándo sale, de dónde viene la decisión, la intención del lead, la espera, qué pasa si responde o no, qué hace el CRM, qué se mide y qué plantilla del CRM reemplaza. Todo se edita en el mismo chat y se guarda solo.
- [Bot Manufactura y Calidad · Árbol de decisión](https://claude.ai/code/artifact/3b3b1835-fa39-4b66-81b2-aca7468d8ce0): todavía refleja la versión 3. Incluye 8 árboles, 20 indicadores, los cursos sugeridos por área (que sirven para la ruta final) y la tabla de transiciones. El árbol se actualizará cuando se valide la versión 4.
- [Bot Manufactura y Calidad · Mensajes y tiempos](https://claude.ai/code/artifact/1038e24c-2194-4ac1-99a9-15a13cda525e): la especificación de la versión 2, que queda como referencia de las respuestas frecuentes, las objeciones y las plantillas de Meta.

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
