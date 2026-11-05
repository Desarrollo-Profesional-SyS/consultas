# Actualización As Is · tres embudos · 16 de octubre al 5 de noviembre de 2026

`SyS_AsIs_Actualizacion_3_embudos_5nov.xlsx` vuelve a medir ISO + Calidad, Manufactura y Calidad y Core Tools Premium con las mismas definiciones de la línea base (5 al 15 de octubre). Sirve para confirmar si el problema del proyecto «Filtro de leads + ruta personalizada + seguimiento» sigue antes de activarlo.

- **Periodo:** leads que entraron del 16 de octubre a las 00:00 h al 5 de noviembre a las 13:30 h (Monterrey). Es el día siguiente al corte de la línea base, que incluyó el 15 de octubre completo.
- **Corte:** 5 de noviembre de 2026, 13:30 h. Solo cuentan los mensajes, cambios de etapa y ventas que ocurrieron hasta esa hora.
- **Tamaño:** 1,100 leads: 690 de ISO + Calidad, 183 de Manufactura y Calidad y 227 de Core Tools Premium.

## Reporte para Dirección

`Reporte_Direccion_Clasificacion_5nov.docx` (y su versión en PDF) resume el libro en 2 hojas, con la identidad de SyS de la propuesta anterior para Dirección:

1. **Hoja 1:** la muestra del 16 de octubre al 5 de noviembre: cifras clave, hallazgos y quién compra.
2. **Hoja 2:** la comparación con la primera muestra, lo que falta para arrancar y lo que se pide autorizar.

`scripts/reporte.py` lo arma a partir de la propuesta anterior descomprimida.

## Libro de Excel

| Hoja | Contenido |
|---|---|
| Resumen | El caso del proyecto (plantilla de Mejoras, paso 2), los 10 puntos de la línea base medidos de nuevo, lo que cambió en el CRM y la conclusión |
| Comparativo | Las mismas métricas por embudo, con la línea base al lado |
| Temperatura | Calientes, tibios y fríos según sus primeras 24 h: leads, ventas, ofertas de $2,799 y plantillas pagadas |
| Semanas | Semana a semana, del 16 de octubre al 5 de noviembre |
| Misma ventana de 7 días | Los dos periodos medidos con el mismo plazo por lead: la comparación más justa |
| Datos | Un renglón por lead, sin nombres ni teléfonos |
| Notas | Definiciones, método, validación y límites |

Las cifras del periodo nuevo son fórmulas sobre la hoja Datos. Se comprobaron contra el cálculo en Python: ninguna diferencia.

## Resultado

El caso del proyecto mide lo que hoy existe. Se cuentan los leads que dicen a qué se dedican y los tibios y fríos. Un lead es caso si:

- dijo a qué se dedica y no contestó en las 24 h siguientes al audio de recomendación del equipo, o no recibió audio;
- o es tibio o frío y recibió la oferta de $2,799.

La ruta en PDF con audio corto todavía no se usa: es la mejora que busca subir la respuesta después del audio.

- **El problema sigue:** 635 de 914 leads medidos (69%). En la línea base fueron 323 de 531 (61%). Con la misma ventana de 7 días por lead: 75% en la línea base y 73.5% ahora.
- **Recomendación con audio:** 365 leads (1 de cada 3) dijeron a qué se dedican. El 93% recibió audio del equipo en 5 minutos (mediana), que dura 1 min 43 s. El 41% ya no contestó en 24 h. Quien contesta compra 7.5%; quien no, 1.4%.
- **Tibios y fríos:** son la mitad de los leads y dejaron 4 de las 31 ventas. Aun así, 470 de 549 recibieron la oferta de $2,799, y a ellos se fueron 638 de las 1,270 plantillas pagadas estimadas.
- **Precio:** 21 de 31 ventas fueron con descuento, $29,036 por debajo de lista. El precio promedio bajó de $3,438 a $3,111.
- **Plan:** arranque el 9 de noviembre en Promo Lean, el embudo donde se hacen las correcciones. Lo encabeza Joceline Benavides, autora del proyecto.

## Validación

Los leads del 5 al 15 de octubre se recalcularon con el mismo código y se compararon lead por lead contra la hoja Datos de la línea base publicada. Hay 620 de los 628 leads; los otros 8 hoy están en otros embudos.

En estado, ventas, ofertas, $2,799, Negativo, facilidades, links y mensajes coinciden al 100%. Las demás comparaciones quedan entre 97% y 99.7%.

## Scripts

`scripts/` contiene la descarga (solo consultas GET al CRM), el cálculo por lead, la duración de los audios, la validación, la ventana de 7 días y el armado del libro.

Los datos del CRM se consultaron en modo de solo lectura con el usuario de Joceline: no se movió, editó, envió ni marcó como visto nada. Los leads se citan solo por su número en el CRM.
