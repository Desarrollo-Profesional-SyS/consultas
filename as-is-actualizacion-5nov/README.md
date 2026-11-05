# Actualización As Is · tres embudos · 16 de octubre al 5 de noviembre de 2026

`SyS_AsIs_Actualizacion_3_embudos_5nov.xlsx` vuelve a medir ISO + Calidad, Manufactura y Calidad y Core Tools Premium con las mismas definiciones de la línea base (5 al 15 de octubre). Sirve para confirmar si el problema del proyecto «Filtro de leads + ruta personalizada + seguimiento» sigue antes de activarlo.

- **Periodo:** leads que entraron del 16 de octubre a las 00:00 h al 5 de noviembre a las 13:30 h (Monterrey). Es el día siguiente al corte de la línea base, que incluyó el 15 de octubre completo.
- **Corte:** 5 de noviembre de 2026, 13:30 h. Solo cuentan los mensajes, cambios de etapa y ventas que ocurrieron hasta esa hora.
- **Tamaño:** 1,100 leads: 690 de ISO + Calidad, 183 de Manufactura y Calidad y 227 de Core Tools Premium.

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

- **El caso del proyecto sigue:** 1,021 de 1,100 leads (93%) no recibieron lo que les toca según su temperatura. Con 7 días o más al corte, 728 de 738 (98.6%). En la línea base fueron 541 de 620 (87%).
- **Tibios y fríos:** son la mitad de los leads y dejaron 4 de las 31 ventas. Aun así, 470 de 549 recibieron la oferta de $2,799, y a ellos se fueron 638 de las 1,270 plantillas pagadas estimadas.
- **Precio:** 21 de las 31 ventas fueron con descuento, $29,036 por debajo de lista. El precio promedio bajó de $3,438 a $3,111.
- **Plantillas pagadas:** las contestó el 4.9% (antes 7.6%). Con la misma ventana de 7 días, 5.2% contra 7.3%.
- **Atención personalizada:** ningún lead caliente recibió su ruta en PDF y un audio de 1 minuto juntos.

## Validación

Los leads del 5 al 15 de octubre se recalcularon con el mismo código y se compararon lead por lead contra la hoja Datos de la línea base publicada. Hay 620 de los 628 leads; los otros 8 hoy están en otros embudos.

En estado, ventas, ofertas, $2,799, Negativo, facilidades, links y mensajes coinciden al 100%. Las demás comparaciones quedan entre 97% y 99.7%.

## Scripts

`scripts/` contiene la descarga (solo consultas GET al CRM), el cálculo por lead, la duración de los audios, la validación, la ventana de 7 días y el armado del libro.

Los datos del CRM se consultaron en modo de solo lectura con el usuario de Joceline: no se movió, editó, envió ni marcó como visto nada. Los leads se citan solo por su número en el CRM.
