# Arma el libro "Actualización As Is" con fórmulas sobre la hoja Datos.
import sys, os, json
from datetime import datetime
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.formula import ArrayFormula
from openpyxl.utils import get_column_letter as L_

D = sys.argv[1]; OUT = sys.argv[2]
N = pd.read_pickle(os.path.join(D, 'leads_nuevo.pkl'))
BASE = json.load(open(os.path.join(D, 'base_valores.json')))   # valores de la línea base (3 embudos)
TXT = json.load(open(os.path.join(D, 'textos.json')))          # hallazgos y veredictos, escritos con los datos
EMB = ['ISO + Calidad', 'Manufactura y Calidad', 'Core Tools Premium']

VINO, MAGENTA, GRIS, TINTA, FONDO = 'FF330A28', 'FF800E64', 'FF6F6270', 'FF4A3540', 'FFFBF8FA'
F = lambda sz=10, b=False, c=TINTA: Font(name='Arial', size=sz, bold=b, color=c)
FILL_H = PatternFill('solid', fgColor=MAGENTA); FILL_S = PatternFill('solid', fgColor=FONDO)
LINEA = Border(bottom=Side(style='thin', color='FFE6DCE3'))
WRAP = Alignment(wrap_text=True, vertical='top')
PCT, NUM, DEC1, MON = '0%', '#,##0', '#,##0.0', '$#,##0'

si = lambda v: 'Sí' if v else 'No'
def nz(v):
    return None if v is None or (isinstance(v, float) and pd.isna(v)) else v

# ---------------------------------------------------------------- Datos
COLS = [
    ('Embudo', lambda r: r.embudo),
    ('ID (#)', lambda r: int(r.lead)),
    ('Entrada', lambda r: r.entrada.tz_convert('America/Monterrey').tz_localize(None).to_pydatetime().replace(microsecond=0)),
    ('Semana', lambda r: r.semana_iso),
    ('¿Entró de 9 a 21 h?', lambda r: si(not r.fuera_horario)),
    ('¿Contestó el saludo?', lambda r: si(r.contesto_saludo)),
    ('Dejó de escribir en', lambda r: r.dejo_en),
    ('¿Dejó de escribir en el saludo o antes?', lambda r: si(r.dejo_en_saludo)),
    ('¿Recibió la pregunta de ocupación?', lambda r: si(r.recibio_pregunta_area)),
    ('¿Contestó la ocupación?', lambda r: si(r.contesto_area) if r.recibio_pregunta_area else None),
    ('¿Entró a Negativo?', lambda r: si(r.entro_negativo)),
    ('¿Llegó a facilidades de pago?', lambda r: si(r.llego_facilidades)),
    ('¿Llegó a forma de pago?', lambda r: si(r.llego_pago)),
    ('Horas hasta el 1er mensaje de una persona', lambda r: nz(round(r.h_1er_msg_persona, 2)) if nz(r.h_1er_msg_persona) is not None else None),
    ('¿Nunca recibió mensaje de una persona?', lambda r: si(r.nunca_persona)),
    ('¿Audio del equipo?', lambda r: si(r.audio_equipo)),
    ('Segundos del 1er audio del equipo', lambda r: nz(round(r.dur_1er_audio_s)) if nz(r.dur_1er_audio_s) is not None else None),
    ('¿Audio del equipo de 1 min o menos?', lambda r: si(r.audio_corto)),
    ('¿Recibió ruta personalizada en PDF?', lambda r: si(r.ruta_pdf)),
    ('¿Recibió oferta?', lambda r: si(r.recibio_oferta)),
    ('¿Recibió $3,799?', lambda r: si(r.recibio_3799)),
    ('¿Recibió $2,799?', lambda r: si(r.recibio_2799)),
    ('Primera oferta enviada por', lambda r: ('Bot' if r.oferta_1_bot else 'Persona') if r.recibio_oferta else None),
    ('Horas hasta la 1a oferta', lambda r: nz(round(r.h_1a_oferta, 2)) if nz(r.h_1a_oferta) is not None else None),
    ('¿Abrió algún link?', lambda r: si(r.abrio_link)),
    ('Mensajes del lead', lambda r: int(r.msgs_lead)),
    ('Mensajes del bot', lambda r: int(r.msgs_bot)),
    ('Mensajes de personas', lambda r: int(r.msgs_persona)),
    ('Temperatura (primeras 24 h)', lambda r: r.temperatura),
    ('Señal: preguntó precio o pago', lambda r: si(r.senal_precio)),
    ('Señal: dijo a qué se dedica', lambda r: si(r.senal_ocupacion)),
    ('Señal: abrió un link', lambda r: si(r.senal_link)),
    ('Señal: dijo que le interesa', lambda r: si(r.senal_interes)),
    ('Plantillas pagadas (estimado)', lambda r: int(r.plantillas_pagadas)),
    ('Respuestas a plantillas pagadas', lambda r: int(r.plantillas_pagadas_resp)),
    ('¿Es caso del proyecto?', None),
    ('¿Meta retuvo algún mensaje?', lambda r: si(r.meta_retenido)),
    ('Estado', lambda r: r.estado),
    ('Cómo llegó a Perdido', lambda r: r.perdido_por),
    ('Razón de pérdida', lambda r: r.razon_perdida),
    ('¿Escribió después de marcarlo Perdido?', lambda r: si(r.escribio_en_perdido)),
    ('¿Compró?', lambda r: si(r.venta)),
    ('Precio de venta', lambda r: nz(r.precio)),
    ('¿Venta a precio de lista?', lambda r: si(r.precio_lista) if r.venta else None),
    ('¿Estuvo en Perdido antes de comprar?', lambda r: si(r.venta_estuvo_perdido) if r.venta else None),
    ('Días desde la entrada al corte', lambda r: round(r.dias_al_corte, 1)),
    ('¿Tiene 7 días o más al corte?', lambda r: si(r.dias_al_corte >= 7)),
]
C = {name: L_(i + 1) for i, (name, _) in enumerate(COLS)}
n = len(N); last = n + 1
def rng(col): return f"Datos!${C[col]}$2:${C[col]}${last}"

wb = Workbook()
ws_d = wb.active; ws_d.title = 'Datos'
ws_d.append([c for c, _ in COLS])
N = N.sort_values('entrada')
for i, r in enumerate(N.itertuples(), start=2):
    row = []
    for name, fn in COLS:
        if fn is None:
            t, ru, au, d2 = (f'{C[x]}{i}' for x in ('Temperatura (primeras 24 h)', '¿Recibió ruta personalizada en PDF?', '¿Audio del equipo de 1 min o menos?', '¿Recibió $2,799?'))
            row.append(f'=IF({t}="Caliente",IF(AND({ru}="Sí",{au}="Sí"),"No","Sí"),IF({d2}="Sí","Sí","No"))')
        else:
            row.append(fn(r))
    ws_d.append(row)
for j, (name, _) in enumerate(COLS, start=1):
    c = ws_d.cell(1, j); c.font = F(10, True, 'FFFFFFFF'); c.fill = FILL_H; c.alignment = Alignment(wrap_text=True, vertical='center')
    ws_d.column_dimensions[L_(j)].width = 14
ws_d.column_dimensions['A'].width = 22; ws_d.column_dimensions['C'].width = 18; ws_d.column_dimensions[C['Dejó de escribir en']].width = 26
for row in ws_d.iter_rows(min_row=2, max_row=last):
    for c in row: c.font = F(9)
for i in range(2, last + 1):
    ws_d[f"{C['Entrada']}{i}"].number_format = 'dd/mm/yyyy hh:mm'
ws_d.freeze_panes = 'C2'; ws_d.auto_filter.ref = f"A1:{L_(len(COLS))}{last}"
ws_d.row_dimensions[1].height = 48

# ---------------------------------------------------------------- fórmulas
def crit(emb):
    return [] if emb is None else [(rng('Embudo'), f'"{emb}"')]
def cnt(emb, *conds):
    parts = crit(emb) + [(rng(c), v) for c, v in conds]
    if not parts: return f"COUNTA({rng('ID (#)')})"
    return 'COUNTIFS(' + ','.join(f'{a},{b}' for a, b in parts) + ')'
def q(v): return '"' + v + '"' if isinstance(v, str) and not v.startswith(('"', '$')) and not v[:1].isdigit() and not v.startswith(('<', '>')) else ('"' + v + '"' if isinstance(v, str) else str(v))
def share(emb, num, den=()):
    return f"=IFERROR({cnt(emb, *[(c, q(v)) for c, v in num + list(den)])}/{cnt(emb, *[(c, q(v)) for c, v in den])},\"\")"
def mediana(emb, col):
    cond = f'({rng(col)}<>"")' + (f'*({rng("Embudo")}="{emb}")' if emb else '')
    return f'=IFERROR(MEDIAN(IF({cond},{rng(col)})),"")'
def promedio(emb, col, *conds):
    parts = crit(emb) + [(rng(c), q(v)) for c, v in conds]
    if not parts: return f'=AVERAGE({rng(col)})'
    return f"=IFERROR(AVERAGEIFS({rng(col)}," + ','.join(f'{a},{b}' for a, b in parts) + '),"")'
def suma(emb, col, *conds):
    parts = crit(emb) + [(rng(c), q(v)) for c, v in conds]
    if not parts: return f'=SUM({rng(col)})'
    return f"=SUMIFS({rng(col)}," + ','.join(f'{a},{b}' for a, b in parts) + ')'

# (etiqueta, tipo, función(emb)->fórmula, formato, clave en BASE, cómo se calcula)
M = [
    ('Volumen', None),
    ('Leads', lambda e: '=' + cnt(e), NUM, 'leads', 'Leads que entraron en el periodo.'),
    ('% que entra fuera de horario', lambda e: share(e, [('¿Entró de 9 a 21 h?', 'No')]), PCT, 'fuera_horario', 'Antes de 9 h o desde 21 h (horario de los bots).'),
    ('Saludo y avance', None),
    ('% que contesta el saludo', lambda e: share(e, [('¿Contestó el saludo?', 'Sí')]), PCT, 'contesta_saludo', 'Escribió después de que el bot pidió el nombre.'),
    ('% que deja de escribir en el saludo o antes', lambda e: share(e, [('¿Dejó de escribir en el saludo o antes?', 'Sí')]), PCT, 'deja_saludo', 'Solo su primer mensaje, o contestó el saludo y no volvió.'),
    ('% que contesta la ocupación', lambda e: share(e, [('¿Contestó la ocupación?', 'Sí')], [('¿Recibió la pregunta de ocupación?', 'Sí')]), PCT, 'ocupacion', 'De quienes recibieron la pregunta; contestó en 24 h con su área o si estudia.'),
    ('% que entra a Negativo', lambda e: share(e, [('¿Entró a Negativo?', 'Sí')]), PCT, 'negativo', 'Lo pasa el bot si nadie lo mueve en 2 h.'),
    ('% que llega a facilidades de pago', lambda e: share(e, [('¿Llegó a facilidades de pago?', 'Sí')]), PCT, 'facilidades', 'Etapa 1.3 o 1.4, o más lejos.'),
    ('% que llega a forma de pago', lambda e: share(e, [('¿Llegó a forma de pago?', 'Sí')]), PCT, 'forma_pago', 'Etapas 2.x, MSI y 3.x, o Ganado.'),
    ('Atención de personas', None),
    ('Horas hasta el 1er mensaje de una persona · mediana', lambda e: ArrayFormula(None, mediana(e, 'Horas hasta el 1er mensaje de una persona')), DEC1, 'h_persona', 'Desde que entra el lead. Mover de etapa no cuenta.'),
    ('% que nunca recibió un mensaje de una persona', lambda e: share(e, [('¿Nunca recibió mensaje de una persona?', 'Sí')]), PCT, 'nunca_persona', 'Hasta el corte, solo le escribió el bot.'),
    ('% con audio del equipo', lambda e: share(e, [('¿Audio del equipo?', 'Sí')]), PCT, 'audio', 'Nota de voz de una persona.'),
    ('Ofertas', None),
    ('% que recibe alguna oferta', lambda e: share(e, [('¿Recibió oferta?', 'Sí')]), PCT, 'oferta', '$3,799, $3,400, $2,799 o $1,950 escrito en un mensaje.'),
    ('% que recibe $3,799', lambda e: share(e, [('¿Recibió $3,799?', 'Sí')]), PCT, 'o3799', ''),
    ('% que recibe $2,799', lambda e: share(e, [('¿Recibió $2,799?', 'Sí')]), PCT, 'o2799', ''),
    ('% de primeras ofertas que manda el bot', lambda e: share(e, [('Primera oferta enviada por', 'Bot')], [('¿Recibió oferta?', 'Sí')]), PCT, 'oferta_bot', 'El resto lo manda una persona, casi siempre con plantilla.'),
    ('Horas hasta la 1a oferta · mediana', lambda e: ArrayFormula(None, mediana(e, 'Horas hasta la 1a oferta')), DEC1, 'h_oferta', 'Desde que entra el lead.'),
    ('Interés y volumen de mensajes', None),
    ('% que abrió algún link', lambda e: share(e, [('¿Abrió algún link?', 'Sí')]), PCT, 'link', 'Ruta, clase demo, mapa o perfil de ejemplo (aviso del CRM).'),
    ('Compra si abrió un link', lambda e: share(e, [('¿Compró?', 'Sí')], [('¿Abrió algún link?', 'Sí')]), '0.0%', 'compra_link', ''),
    ('Compra si no abrió un link', lambda e: share(e, [('¿Compró?', 'Sí')], [('¿Abrió algún link?', 'No')]), '0.0%', 'compra_nolink', ''),
    ('Compra con mensaje de una persona en la 1a hora', lambda e: share(e, [('¿Compró?', 'Sí')], [('Horas hasta el 1er mensaje de una persona', '<=1')]), '0.0%', 'compra_1h', 'Relación, no causa.'),
    ('Compra con mensaje de una persona después de 1 día', lambda e: share(e, [('¿Compró?', 'Sí')], [('Horas hasta el 1er mensaje de una persona', '>24')]), '0.0%', 'compra_1d', ''),
    ('Mensajes del bot por lead · promedio', lambda e: promedio(e, 'Mensajes del bot'), DEC1, 'm_bot', ''),
    ('Mensajes del lead por lead · promedio', lambda e: promedio(e, 'Mensajes del lead'), DEC1, 'm_lead', ''),
    ('Mensajes de personas por lead · promedio', lambda e: promedio(e, 'Mensajes de personas'), DEC1, 'm_persona', ''),
    ('Tibios, fríos y plantillas', None),
    ('% de tibios y fríos que recibe $2,799', lambda e: f"=IFERROR(({cnt(e, ('Temperatura (primeras 24 h)', '"Tibio"'), ('¿Recibió $2,799?', '"Sí"'))}+{cnt(e, ('Temperatura (primeras 24 h)', '"Frío"'), ('¿Recibió $2,799?', '"Sí"'))})/({cnt(e, ('Temperatura (primeras 24 h)', '"Tibio"'))}+{cnt(e, ('Temperatura (primeras 24 h)', '"Frío"'))}),\"\")", PCT, 'tf2799', 'Tibio o frío según sus primeras 24 h (hoja Temperatura).'),
    ('Plantillas pagadas (estimado)', lambda e: suma(e, 'Plantillas pagadas (estimado)'), NUM, 'plantillas', 'Fuera de la ventana de 24 h y después de las 72 h gratuitas del anuncio.'),
    ('% de respuesta a plantillas pagadas', lambda e: f"=IFERROR({suma(e, 'Respuestas a plantillas pagadas')[1:]}/{suma(e, 'Plantillas pagadas (estimado)')[1:]},\"\")", '0.0%', 'resp_plant', 'El lead escribe en las 24 h siguientes.'),
    ('Leads con mensajes retenidos por Meta', lambda e: '=' + cnt(e, ('¿Meta retuvo algún mensaje?', '"Sí"')), NUM, 'meta', '«Para mantener la salud del ecosistema».'),
    ('% de leads que son caso del proyecto', lambda e: share(e, [('¿Es caso del proyecto?', 'Sí')]), PCT, 'caso_pct', 'Caliente sin ruta en PDF y audio de 1 min; tibio o frío con $2,799.'),
    ('Ventas y precio', None),
    ('Ventas', lambda e: '=' + cnt(e, ('¿Compró?', '"Sí"')), NUM, 'ventas', 'Leads en Ganado al corte.'),
    ('Conversión (ventas ÷ leads)', lambda e: share(e, [('¿Compró?', 'Sí')]), '0.0%', 'conversion', ''),
    ('Ventas a $3,999 o más', lambda e: '=' + cnt(e, ('¿Venta a precio de lista?', '"Sí"')), NUM, 'ventas_lista', 'Precio registrado en el CRM.'),
    ('Ventas con descuento', lambda e: '=' + cnt(e, ('¿Venta a precio de lista?', '"No"')), NUM, 'ventas_desc', ''),
    ('Precio promedio de venta', lambda e: promedio(e, 'Precio de venta', ('¿Compró?', 'Sí')), MON, 'precio', 'Lista: $3,999.'),
    ('Ingreso registrado', lambda e: suma(e, 'Precio de venta', ('¿Compró?', 'Sí')), MON, 'ingreso', 'Suma de los precios de venta.'),
    ('Estado al corte', None),
    ('Abiertos', lambda e: '=' + cnt(e, ('Estado', '"Abierto"')), NUM, 'abiertos', 'Todavía pueden avanzar.'),
    ('Perdidos', lambda e: '=' + cnt(e, ('Estado', '"Perdido"')), NUM, 'perdidos', ''),
    ('% de Perdidos con razón «No contestaron»', lambda e: share(e, [('Razón de pérdida', 'No contestaron')], [('Estado', 'Perdido')]), PCT, 'perd_nc', ''),
    ('% de Perdidos que marcó una persona', lambda e: share(e, [('Cómo llegó a Perdido', 'Persona')], [('Estado', 'Perdido')]), PCT, 'perd_persona', 'El resto lo mandó el bot.'),
    ('Leads que escribieron después de marcarlos Perdido', lambda e: '=' + cnt(e, ('¿Escribió después de marcarlo Perdido?', '"Sí"')), NUM, 'escribio_perdido', ''),
    ('Ventas de leads que estuvieron en Perdido', lambda e: '=' + cnt(e, ('¿Estuvo en Perdido antes de comprar?', '"Sí"')), NUM, 'venta_perdido', ''),
]

def hoja_titulo(ws, titulo, sub):
    ws['B1'] = 'DESARROLLO PROFESIONAL SyS'; ws['B1'].font = F(10, True, MAGENTA)
    ws['B2'] = titulo; ws['B2'].font = F(17, True, VINO)
    ws['B3'] = sub; ws['B3'].font = F(9, False, GRIS)
    ws.column_dimensions['A'].width = 2
    ws.sheet_view.showGridLines = False

def encabezado(ws, row, vals, widths=None):
    for j, v in enumerate(vals, start=2):
        c = ws.cell(row, j, v); c.font = F(10, True, 'FFFFFFFF'); c.fill = FILL_H; c.alignment = Alignment(wrap_text=True, vertical='center')
    ws.row_dimensions[row].height = 32

SUB = TXT['subtitulo']
# ---------------------------------------------------------------- Comparativo
ws_c = wb.create_sheet('Comparativo', 0)
hoja_titulo(ws_c, 'Comparativo por embudo · 16 oct al 5 nov', SUB)
encabezado(ws_c, 5, ['Métrica'] + EMB + ['Tres embudos', 'Línea base · 5 al 15 oct', 'Cómo se calcula'])
for k, e in enumerate(EMB + [None]):
    ws_c.cell(6, 3 + k, f'={cnt(e)}').font = F(9, False, GRIS); ws_c.cell(6, 3 + k).number_format = '#,##0" leads"'
ws_c.cell(6, 7, BASE['leads']).number_format = '#,##0" leads"'; ws_c.cell(6, 7).font = F(9, False, GRIS)
row = 7; POS = {}
for item in M:
    if item[1] is None:
        row += 1; c = ws_c.cell(row, 2, item[0]); c.font = F(11, True, MAGENTA); row += 1; continue
    label, fn, fmt, bkey, nota = item
    ws_c.cell(row, 2, label).font = F(10, True, VINO)
    for k, e in enumerate(EMB + [None]):
        col = 3 + k; f = fn(e)
        if isinstance(f, ArrayFormula):
            ref = f'{L_(col)}{row}'; ws_c[ref] = ArrayFormula(ref, f.text)
        else:
            ws_c.cell(row, col, f)
        ws_c.cell(row, col).number_format = fmt; ws_c.cell(row, col).font = F(10, k == 3, TINTA)
    b = BASE.get(bkey)
    cb = ws_c.cell(row, 7, b); cb.number_format = fmt; cb.font = F(10, False, GRIS)
    cn = ws_c.cell(row, 8, nota); cn.font = F(9, False, GRIS); cn.alignment = WRAP
    POS[bkey] = row
    for j in range(2, 9): ws_c.cell(row, j).border = LINEA
    row += 1
ws_c.column_dimensions['B'].width = 46
for col in 'CDEFG': ws_c.column_dimensions[col].width = 15
ws_c.column_dimensions['H'].width = 52
ws_c.freeze_panes = 'C7'

# ---------------------------------------------------------------- Temperatura
ws_t = wb.create_sheet('Temperatura', 1)
hoja_titulo(ws_t, 'Calientes, tibios y fríos · primeras 24 horas', SUB)
encabezado(ws_t, 5, ['Temperatura', 'Qué hizo en sus primeras 24 h', 'Leads', '% de los leads', 'Ventas', '% de las ventas', 'Recibieron $2,799', 'Plantillas pagadas (estimado)', 'Respuesta a la plantilla', 'Línea base: leads', 'Línea base: ventas', 'Línea base: $2,799', 'Línea base: plantillas', 'Línea base: respuesta'])
DESC = {'Caliente': 'Preguntó precio o formas de pago, dijo a qué se dedica, abrió su ruta u otro link, o dijo que le interesa.',
        'Tibio': 'Contestó, pero sin ninguna de esas señales.', 'Frío': 'No volvió a escribir después de su primer mensaje.'}
T = rng('Temperatura (primeras 24 h)')
for i, t in enumerate(['Caliente', 'Tibio', 'Frío']):
    r = 6 + i
    vals = [t, DESC[t], f'=COUNTIFS({T},"{t}")', f'=D{r}/COUNTA({rng("ID (#)")})', f'=COUNTIFS({T},"{t}",{rng("¿Compró?")},"Sí")', f'=IFERROR(F{r}/COUNTIFS({rng("¿Compró?")},"Sí"),"")',
            f'=COUNTIFS({T},"{t}",{rng("¿Recibió $2,799?")},"Sí")', f'=SUMIFS({rng("Plantillas pagadas (estimado)")},{T},"{t}")', f'=IFERROR(SUMIFS({rng("Respuestas a plantillas pagadas")},{T},"{t}")/I{r},"")'] + BASE['temperatura'][t]
    for j, v in enumerate(vals, start=2):
        c = ws_t.cell(r, j, v); c.font = F(10, j == 2, VINO if j == 2 else TINTA); c.alignment = WRAP; c.border = LINEA
    for col, fmt in zip('DEFGHIJKLMNO', [NUM, PCT, NUM, PCT, NUM, NUM, '0.0%', NUM, NUM, NUM, NUM, '0.0%']):
        ws_t[f'{col}{r}'].number_format = fmt; ws_t[f'{col}{r}'].alignment = Alignment(vertical='top')
r = 9
ws_t.cell(r, 2, 'Total').font = F(10, True, VINO)
for col in 'DFHI': ws_t[f'{col}{r}'] = f'=SUM({col}6:{col}8)'; ws_t[f'{col}{r}'].number_format = NUM; ws_t[f'{col}{r}'].font = F(10, True)
ws_t['J9'] = f'=IFERROR(SUM({rng("Respuestas a plantillas pagadas")})/I9,"")'; ws_t['J9'].number_format = '0.0%'; ws_t['J9'].font = F(10, True)
for col, v in zip('KLMNO', BASE['temperatura_total']):
    ws_t[f'{col}9'] = v; ws_t[f'{col}9'].number_format = '0.0%' if col == 'O' else NUM; ws_t[f'{col}9'].font = F(10, True, GRIS)
ws_t['B11'] = 'Tibios y fríos'; ws_t['B11'].font = F(10, True, VINO)
ws_t['C11'] = 'Peso en leads, en ventas y en lo que se les manda'; ws_t['C11'].font = F(9, False, GRIS)
for col, f, fmt in [('E', '=SUM(E7:E8)', PCT), ('G', '=SUM(G7:G8)', PCT), ('H', '=SUM(H7:H8)/H9', PCT), ('I', '=SUM(I7:I8)/I9', PCT)]:
    ws_t[f'{col}11'] = f; ws_t[f'{col}11'].number_format = fmt; ws_t[f'{col}11'].font = F(10, True, MAGENTA)
ws_t['B13'] = TXT['temperatura_nota']; ws_t['B13'].font = F(9, False, GRIS); ws_t['B13'].alignment = WRAP; ws_t.merge_cells('B13:O13'); ws_t.row_dimensions[13].height = 54
ws_t.column_dimensions['B'].width = 13; ws_t.column_dimensions['C'].width = 46
for col in 'DEFGHIJKLMNO': ws_t.column_dimensions[col].width = 12

# ---------------------------------------------------------------- Semanas
ws_s = wb.create_sheet('Semanas', 2)
hoja_titulo(ws_s, 'Semana a semana', SUB)
encabezado(ws_s, 5, ['Semana', 'Días', 'Leads', '% deja de escribir en el saludo o antes', '% que recibe $2,799', '% de primeras ofertas del bot', 'Ventas', 'Ventas con descuento', '% de tibios y fríos con $2,799', '% de leads que son caso del proyecto'])
SEM = rng('Semana')
for i, (sem, dias) in enumerate(TXT['semanas']):
    r = 6 + i
    vals = [sem, dias, f'=COUNTIFS({SEM},B{r})', f'=IFERROR(COUNTIFS({SEM},B{r},{rng("¿Dejó de escribir en el saludo o antes?")},"Sí")/D{r},"")',
            f'=IFERROR(COUNTIFS({SEM},B{r},{rng("¿Recibió $2,799?")},"Sí")/D{r},"")',
            f'=IFERROR(COUNTIFS({SEM},B{r},{rng("Primera oferta enviada por")},"Bot")/COUNTIFS({SEM},B{r},{rng("¿Recibió oferta?")},"Sí"),"")',
            f'=COUNTIFS({SEM},B{r},{rng("¿Compró?")},"Sí")', f'=COUNTIFS({SEM},B{r},{rng("¿Venta a precio de lista?")},"No")',
            f'=IFERROR((COUNTIFS({SEM},B{r},{T},"Tibio",{rng("¿Recibió $2,799?")},"Sí")+COUNTIFS({SEM},B{r},{T},"Frío",{rng("¿Recibió $2,799?")},"Sí"))/(COUNTIFS({SEM},B{r},{T},"Tibio")+COUNTIFS({SEM},B{r},{T},"Frío")),"")',
            f'=IFERROR(COUNTIFS({SEM},B{r},{rng("¿Es caso del proyecto?")},"Sí")/D{r},"")']
    for j, v in enumerate(vals, start=2):
        c = ws_s.cell(r, j, v); c.font = F(10, j == 2, VINO if j == 2 else TINTA); c.border = LINEA
    for col, fmt in zip('DEFGHIJK', [NUM, PCT, PCT, PCT, NUM, NUM, PCT, PCT]): ws_s[f'{col}{r}'].number_format = fmt
nr = 6 + len(TXT['semanas']) + 1
ws_s.cell(nr, 2, TXT['semanas_nota']).font = F(9, False, GRIS); ws_s.cell(nr, 2).alignment = WRAP; ws_s.merge_cells(f'B{nr}:K{nr}'); ws_s.row_dimensions[nr].height = 40
ws_s.column_dimensions['B'].width = 20; ws_s.column_dimensions['C'].width = 14
for col in 'DEFGHIJK': ws_s.column_dimensions[col].width = 15

# ---------------------------------------------------------------- Misma ventana
V7 = TXT['ventana7']
ws_v = wb.create_sheet('Misma ventana de 7 días', 3)
hoja_titulo(ws_v, 'Los dos periodos con la misma ventana: los primeros 7 días de cada lead', SUB)
encabezado(ws_v, 5, ['Métrica', 'Línea base · 5 al 15 oct', '16 oct al 29 oct', 'Cómo leerlo'])
for i, (lab, vb, vn, fmt, nota) in enumerate(V7['filas']):
    r = 6 + i
    ws_v.cell(r, 2, lab).font = F(10, True, VINO)
    for j, v in ((3, vb), (4, vn)):
        c = ws_v.cell(r, j, v); c.number_format = fmt; c.font = F(10, j == 4, TINTA)
    c = ws_v.cell(r, 5, nota); c.font = F(9, False, GRIS); c.alignment = WRAP
    for j in range(2, 6): ws_v.cell(r, j).border = LINEA
r = 6 + len(V7['filas']) + 1
c = ws_v.cell(r, 2, V7['nota']); c.font = F(9, False, GRIS); c.alignment = WRAP; ws_v.merge_cells(f'B{r}:E{r}'); ws_v.row_dimensions[r].height = 58
ws_v.column_dimensions['B'].width = 46; ws_v.column_dimensions['C'].width = 18; ws_v.column_dimensions['D'].width = 18; ws_v.column_dimensions['E'].width = 70

# ---------------------------------------------------------------- Resumen
ws_r = wb.create_sheet('Resumen', 0)
hoja_titulo(ws_r, 'Actualización As Is · ¿sigue el problema?', SUB)
ws_r['B5'] = 'El caso del proyecto (plantilla de Mejoras · paso 2)'; ws_r['B5'].font = F(12, True, MAGENTA)
encabezado(ws_r, 6, ['Medición', 'Día del corte', 'Leads revisados', 'Leads con el problema', '%', 'Calientes sin ruta en PDF y audio de 1 min', 'Tibios y fríos con $2,799'])
CASO = rng('¿Es caso del proyecto?')
filas_caso = [
    ['Línea base · 5 al 15 oct'] + BASE['caso'],
    ['Actualización · 16 oct al 5 nov', TXT['corte_corto'], f'=COUNTA({rng("ID (#)")})', f'=COUNTIFS({CASO},"Sí")', '=E8/D8',
     f'=COUNTIFS({T},"Caliente",{CASO},"Sí")', f'=COUNTIFS({T},"Tibio",{CASO},"Sí")+COUNTIFS({T},"Frío",{CASO},"Sí")'],
    ['Actualización · solo leads con 7 días o más', TXT['corte_corto'], f'=COUNTIFS({rng("¿Tiene 7 días o más al corte?")},"Sí")', f'=COUNTIFS({rng("¿Tiene 7 días o más al corte?")},"Sí",{CASO},"Sí")', '=E9/D9',
     f'=COUNTIFS({rng("¿Tiene 7 días o más al corte?")},"Sí",{T},"Caliente",{CASO},"Sí")', f'=COUNTIFS({rng("¿Tiene 7 días o más al corte?")},"Sí",{T},"Tibio",{CASO},"Sí")+COUNTIFS({rng("¿Tiene 7 días o más al corte?")},"Sí",{T},"Frío",{CASO},"Sí")'],
]
for i, vals in enumerate(filas_caso):
    r = 7 + i
    for j, v in enumerate(vals, start=2):
        c = ws_r.cell(r, j, v); c.font = F(10, j == 2 or j == 6, VINO if j == 2 else (MAGENTA if j == 6 else TINTA)); c.border = LINEA
    for col, fmt in zip('DEFGH', [NUM, NUM, PCT, NUM, NUM]): ws_r[f'{col}{r}'].number_format = fmt
ws_r['B10'] = TXT['caso_nota']; ws_r['B10'].font = F(9, False, GRIS); ws_r['B10'].alignment = WRAP; ws_r.merge_cells('B10:H10'); ws_r.row_dimensions[10].height = 44

ws_r['B12'] = 'Los 10 puntos de la línea base, medidos de nuevo'; ws_r['B12'].font = F(12, True, MAGENTA)
encabezado(ws_r, 13, ['Punto', 'Línea base · 5 al 15 oct', '16 oct al 5 nov', 'ISO + Calidad', 'Manufactura y Calidad', 'Core Tools Premium', '¿Sigue?', 'Qué muestra el dato'])
for i, p in enumerate(TXT['puntos']):
    r = 14 + i
    c = ws_r.cell(r, 2, p['punto']); c.font = F(10, True, VINO); c.alignment = WRAP
    c = ws_r.cell(r, 3, p['base']); c.number_format = p['fmt']; c.font = F(10, False, GRIS); c.alignment = Alignment(vertical='top')
    src = POS[p['clave']]
    for j, col in enumerate('FCDE'):
        cc = ws_r.cell(r, 4 + j, f'=Comparativo!{col}{src}'); cc.number_format = p['fmt']; cc.font = F(10, j == 0, TINTA); cc.alignment = Alignment(vertical='top')
    c = ws_r.cell(r, 8, p['sigue']); c.font = F(10, True, MAGENTA if p['sigue'].startswith('Sí') else TINTA); c.alignment = Alignment(wrap_text=True, vertical='top', horizontal='center')
    c = ws_r.cell(r, 9, p['texto']); c.font = F(9, False, TINTA); c.alignment = WRAP
    for j in range(2, 10): ws_r.cell(r, j).border = LINEA
    ws_r.row_dimensions[r].height = p.get('alto', 50)
r = 14 + len(TXT['puntos']) + 1
ws_r.cell(r, 2, 'Lo que cambió en el CRM durante el periodo').font = F(12, True, MAGENTA); r += 1
for t in TXT['cambios']:
    c = ws_r.cell(r, 2, '•  ' + t); c.font = F(10); c.alignment = WRAP; ws_r.merge_cells(f'B{r}:I{r}'); ws_r.row_dimensions[r].height = 30; r += 1
r += 1
ws_r.cell(r, 2, 'Conclusión').font = F(12, True, MAGENTA); r += 1
for t in TXT['conclusion']:
    c = ws_r.cell(r, 2, '•  ' + t); c.font = F(10); c.alignment = WRAP; ws_r.merge_cells(f'B{r}:I{r}'); ws_r.row_dimensions[r].height = 44; r += 1
r += 1
c = ws_r.cell(r, 2, TXT['pie']); c.font = F(9, False, GRIS); c.alignment = WRAP; ws_r.merge_cells(f'B{r}:I{r}'); ws_r.row_dimensions[r].height = 40
ws_r.column_dimensions['B'].width = 40
for col in 'CDEFG': ws_r.column_dimensions[col].width = 14
ws_r.column_dimensions['H'].width = 16; ws_r.column_dimensions['I'].width = 70

# ---------------------------------------------------------------- Notas
ws_n = wb.create_sheet('Notas')
hoja_titulo(ws_n, 'Notas y definiciones', SUB)
r = 5
for k, v in TXT['notas']:
    a = ws_n.cell(r, 2, k); a.font = F(10, True, VINO); a.alignment = WRAP
    b = ws_n.cell(r, 3, v); b.font = F(10); b.alignment = WRAP
    ws_n.row_dimensions[r].height = max(30, 15 * (len(v) // 95 + 1)); r += 1
ws_n.column_dimensions['B'].width = 30; ws_n.column_dimensions['C'].width = 110

for ws in wb.worksheets:
    ws.sheet_properties.tabColor = '800E64' if ws.title in ('Resumen',) else None
wb.save(OUT)
print('ok', OUT, n)
