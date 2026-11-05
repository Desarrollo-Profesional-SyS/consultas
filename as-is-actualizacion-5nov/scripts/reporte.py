# Reporte de 2 hojas para Dirección con la identidad de SyS (misma plantilla que la propuesta anterior).
import os, re, shutil, sys, zipfile
from xml.sax.saxutils import escape

SRC = sys.argv[1]   # carpeta con la propuesta anterior descomprimida
OUT = sys.argv[2]   # .docx de salida
TMP = OUT + '.d'

RF = '<w:rFonts w:ascii="Poppins" w:cs="Poppins" w:eastAsia="Poppins" w:hAnsi="Poppins"/>'
TINTA, VINO, GRIS, ROSA, MAGENTA, MAG2, MAG3, FONDO = '2A1A24', '2A0820', '6E5E69', 'E91E63', '800E64', 'C2468F', 'E28BBE', 'F4ECF1'
NOB = '<w:tcBorders><w:top w:val="none" w:color="FFFFFF" w:sz="0"/><w:left w:val="none" w:color="FFFFFF" w:sz="0"/><w:bottom w:val="none" w:color="FFFFFF" w:sz="0"/><w:right w:val="none" w:color="FFFFFF" w:sz="0"/></w:tcBorders>'
TBLPR = '<w:tblPr><w:tblW w:type="dxa" w:w="{w}"/><w:tblBorders><w:top w:val="single" w:color="auto" w:sz="4"/><w:left w:val="single" w:color="auto" w:sz="4"/><w:bottom w:val="single" w:color="auto" w:sz="4"/><w:right w:val="single" w:color="auto" w:sz="4"/><w:insideH w:val="single" w:color="auto" w:sz="4"/><w:insideV w:val="single" w:color="auto" w:sz="4"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>'
ANCHO = 10282

def run(text, sz=19, color=TINTA, b=False, i=False, spacing=None):
    rpr = RF + ('<w:b/><w:bCs/>' if b else '') + ('<w:i/><w:iCs/>' if i else '') + f'<w:color w:val="{color}"/>' + (f'<w:spacing w:val="{spacing}"/>' if spacing else '') + f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/>'
    return f'<w:r><w:rPr>{rpr}</w:rPr><w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

def segs(parts, sz=19, color=TINTA, bold_color=None):
    """parts: texto con **negritas**."""
    out = []
    for k, t in enumerate(re.split(r'\*\*', parts)):
        if t: out.append(run(t, sz, (bold_color or color) if k % 2 else color, b=bool(k % 2)))
    return ''.join(out)

def p(content, after=70, before=0, line=264, jc=None, extra=''):
    return f'<w:p><w:pPr>{extra}<w:spacing w:after="{after}" w:before="{before}" w:line="{line}"/>' + (f'<w:jc w:val="{jc}"/>' if jc else '') + f'</w:pPr>{content}</w:p>'

def banner(sub):
    logo = ('<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="381000" cy="438150"/><wp:effectExtent t="0" r="0" b="0" l="0"/><wp:docPr id="1" name="Logo SyS" descr="Logotipo de Desarrollo Profesional SyS" title=""/>'
            '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="" descr=""/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId11" cstate="none"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="381000" cy="438150"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')
    c1 = f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="1000"/>{NOB}<w:shd w:fill="{VINO}" w:color="auto" w:val="clear"/><w:tcMar><w:top w:type="dxa" w:w="180"/><w:left w:type="dxa" w:w="240"/><w:bottom w:type="dxa" w:w="180"/><w:right w:type="dxa" w:w="0"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>' + '<w:p><w:pPr><w:spacing w:after="0" w:before="0"/><w:jc w:val="center"/></w:pPr>' + logo + '</w:p>' + '</w:tc>'
    c2 = (f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="9282"/>{NOB}<w:shd w:fill="{VINO}" w:color="auto" w:val="clear"/><w:tcMar><w:top w:type="dxa" w:w="180"/><w:left w:type="dxa" w:w="120"/><w:bottom w:type="dxa" w:w="180"/><w:right w:type="dxa" w:w="300"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>'
          + p(run('DESARROLLO PROFESIONAL SyS', 22, 'FFFFFF', b=True), 30, 0, 270) + p(run(sub, 14, 'E8C6DA', spacing=20), 0, 0, 270) + '</w:tc>')
    return '<w:tbl>' + TBLPR.format(w=ANCHO) + '<w:tblGrid><w:gridCol w:w="1000"/><w:gridCol w:w="9282"/></w:tblGrid><w:tr>' + c1 + c2 + '</w:tr></w:tbl>'

def espacio(after=120): return p(run('', 19), after, 0, 240)
def titulo(t): return p(run(t, 40, VINO, b=True), 60, 0, 240)
def subtitulo(t): return p(run(t, 19, GRIS), 80, 0, 264)
def base(t): return p(run(t, 14, GRIS), 160, 0, 264, extra=f'<w:pBdr><w:bottom w:val="single" w:color="{ROSA}" w:sz="12" w:space="6"/></w:pBdr>')
def ceja(t, before=180): return p(run(t, 15, ROSA, b=True, spacing=10), 20, before, 270, extra='<w:keepNext/>')
def encabezado(t): return p(run(t, 28, VINO, b=True), 90, 0, 252, extra='<w:keepNext/>')
def texto(t, after=80, sz=19): return p(segs(t, sz), after, 0, 264)
def nota(t, after=40, before=30): return p(run(t, 14, GRIS, i=True), after, before, 250)
def vineta(t, after=55): return p(segs(t, 18), after, 0, 252, extra='<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>')
def salto(): return '<w:p><w:pPr><w:spacing w:after="0" w:before="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>'

def recuadro(etiqueta, parrafos):
    cuerpo = p(run(etiqueta, 14, ROSA, b=True, spacing=10), 50, 0, 270)
    for k, t in enumerate(parrafos):
        cuerpo += p(segs(t, 19, TINTA, MAGENTA), 0 if k == len(parrafos) - 1 else 60, 0, 268)
    tc = (f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{ANCHO}"/><w:tcBorders><w:top w:val="none" w:color="FFFFFF" w:sz="0"/><w:left w:val="single" w:color="{ROSA}" w:sz="36"/><w:bottom w:val="none" w:color="FFFFFF" w:sz="0"/><w:right w:val="none" w:color="FFFFFF" w:sz="0"/></w:tcBorders>'
          f'<w:shd w:fill="{FONDO}" w:color="auto" w:val="clear"/><w:tcMar><w:top w:type="dxa" w:w="140"/><w:left w:type="dxa" w:w="260"/><w:bottom w:type="dxa" w:w="140"/><w:right w:type="dxa" w:w="260"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>{cuerpo}</w:tc>')
    return '<w:tbl>' + TBLPR.format(w=ANCHO) + f'<w:tblGrid><w:gridCol w:w="{ANCHO}"/></w:tblGrid><w:tr>{tc}</w:tr></w:tbl>'

def cifras(items):
    ws = [2570, 2570, 2570, 2572]
    celdas = ''
    for (grande, chico, color), w in zip(items, ws):
        celdas += (f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{w}"/><w:tcBorders><w:top w:val="single" w:color="FFFFFF" w:sz="24"/><w:left w:val="single" w:color="FFFFFF" w:sz="24"/><w:bottom w:val="single" w:color="FFFFFF" w:sz="24"/><w:right w:val="single" w:color="FFFFFF" w:sz="24"/></w:tcBorders>'
                   f'<w:shd w:fill="{FONDO}" w:color="auto" w:val="clear"/><w:tcMar><w:top w:type="dxa" w:w="120"/><w:left w:type="dxa" w:w="110"/><w:bottom w:type="dxa" w:w="120"/><w:right w:type="dxa" w:w="110"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>'
                   + p(run(grande, 34, color, b=True), 20, 0, 240, 'center') + p(run(chico, 14, TINTA), 0, 0, 210, 'center') + '</w:tc>')
    return '<w:tbl>' + TBLPR.format(w=ANCHO) + '<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in ws) + f'</w:tblGrid><w:tr>{celdas}</w:tr></w:tbl>'

def tabla(anchos, encab, filas, alinear, total=None, tam=15, colores=None):
    """filas: listas de textos (pueden llevar **negritas**); colores: {(fila, col): color}."""
    def celda(w, contenido, jc, fill=None, borde_inf=True, head=False):
        bord = '<w:tcBorders><w:top w:val="none" w:color="FFFFFF" w:sz="0"/><w:left w:val="none" w:color="FFFFFF" w:sz="0"/>' + (f'<w:bottom w:val="single" w:color="E8C6DA" w:sz="4"/>' if borde_inf else '<w:bottom w:val="none" w:color="FFFFFF" w:sz="0"/>') + '<w:right w:val="none" w:color="FFFFFF" w:sz="0"/></w:tcBorders>'
        shd = f'<w:shd w:fill="{fill}" w:color="auto" w:val="clear"/>' if fill else ''
        return (f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{w}"/>{bord}{shd}<w:tcMar><w:top w:type="dxa" w:w="42"/><w:left w:type="dxa" w:w="100"/><w:bottom w:type="dxa" w:w="42"/><w:right w:type="dxa" w:w="100"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>'
                + p(contenido, 0, 0, 228, jc, extra='<w:keepNext/>' if head else '') + '</w:tc>')
    x = '<w:tbl>' + TBLPR.format(w=sum(anchos)) + '<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in anchos) + '</w:tblGrid>'
    x += '<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' + ''.join(celda(w, run(h, tam, 'FFFFFF', b=True), a, VINO, False, True) for w, h, a in zip(anchos, encab, alinear)) + '</w:tr>'
    for i, f in enumerate(filas):
        x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>'
        for j, (w, t, a) in enumerate(zip(anchos, f, alinear)):
            col = (colores or {}).get((i, j), TINTA)
            x += celda(w, segs(t, tam + 1, col), a)
        x += '</w:tr>'
    if total:
        x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + ''.join(celda(w, run(t, tam + 1, VINO, b=True), a, FONDO, False) for w, t, a in zip(anchos, total, alinear)) + '</w:tr>'
    return x + '</w:tbl>'

def barra(etiqueta, total, partes):
    ws_total = ANCHO - 3000
    anchos = [3000] + [max(640, round(ws_total * v / 100)) for v in partes]
    k = max(range(1, len(anchos)), key=lambda i: anchos[i]); anchos[k] += ANCHO - sum(anchos)
    fills = [MAGENTA, MAG2, MAG3]
    c = (f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="3000"/>{NOB}<w:tcMar><w:top w:type="dxa" w:w="35"/><w:left w:type="dxa" w:w="0"/><w:bottom w:type="dxa" w:w="35"/><w:right w:type="dxa" w:w="120"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>'
         + p(run(etiqueta + '  ', 15, TINTA, b=True) + run(total, 15, GRIS), 0, 0, 228) + '</w:tc>')
    for w, v, fill in zip(anchos[1:], partes, fills):
        c += (f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{w}"/><w:tcBorders><w:top w:val="single" w:color="FFFFFF" w:sz="16"/><w:left w:val="single" w:color="FFFFFF" w:sz="16"/><w:bottom w:val="single" w:color="FFFFFF" w:sz="16"/><w:right w:val="single" w:color="FFFFFF" w:sz="16"/></w:tcBorders>'
              f'<w:shd w:fill="{fill}" w:color="auto" w:val="clear"/><w:tcMar><w:top w:type="dxa" w:w="35"/><w:left w:type="dxa" w:w="20"/><w:bottom w:type="dxa" w:w="35"/><w:right w:type="dxa" w:w="20"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>'
              + p(run(f'{v}%', 15 if v >= 8 else 12, 'FFFFFF', b=True), 0, 0, 228, 'center') + '</w:tc>')
    return '<w:tbl>' + TBLPR.format(w=ANCHO) + '<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in anchos) + '</w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="340" w:hRule="atLeast"/></w:trPr>' + c + '</w:tr></w:tbl>'

def leyenda():
    x = ''
    for col, t in [(MAGENTA, 'Caliente      '), (MAG2, 'Tibio      '), (MAG3, 'Frío')]:
        x += run('■ ', 20, col) + run(t, 15, TINTA)
    return p(x, 50, 0, 270, extra='<w:keepNext/>')

# ----------------------------------------------------------------- contenido
B = []
# Hoja 1
B += [banner('EJE CURSOS  /  ACTUALIZACIÓN PARA DIRECCIÓN'), espacio(100),
      titulo('El problema sigue: 9 de cada 10 leads'),
      subtitulo('Tres semanas después de la línea base, el bot y el equipo siguen tratando igual a todos los leads.'),
      base('Base: 1,100 leads de ISO + Calidad, Manufactura y Calidad y Core Tools Premium · 16 oct al 5 nov de 2026 · CRM en solo lectura'),
      recuadro('EN POCAS PALABRAS', [
          'En tres semanas entraron 1,100 leads y todos recibieron el mismo guion. **1,021 (93%) no recibieron lo que les tocaba**: ningún lead caliente recibió su ruta en PDF con un audio corto, y 470 de 549 tibios y fríos recibieron la oferta de $2,799.',
          'Mientras tanto, **la mitad de los leads dejó 27 de las 31 ventas**. Seguimos regalando el precio a quien ya quería comprar y pagando mensajes que casi nadie contesta.']),
      espacio(60),
      cifras([('93%', 'de los leads no recibió lo que le tocaba (98.6% con 7 días o más)', MAGENTA),
              ('21 de 31', 'ventas con descuento: $29,036 abajo del precio de lista', ROSA),
              ('4.9%', 'de las ~1,270 plantillas pagadas obtuvo respuesta', MAGENTA),
              ('27 de 31', 'ventas vinieron de los calientes, la mitad de los leads', ROSA)]),
      ceja('01 · LO QUE ENCONTRAMOS'), encabezado('Mismo guion y mismas ofertas para todos'),
      vineta('**Ofertas por reloj, a casi todos.** El 83% recibió la de $2,799. El bot la sigue enviando con «Nos quedan 4 lugares» y «la cerramos hoy», y el equipo manda la misma oferta: el 40% de las primeras ofertas ya las envía una persona.'),
      vineta('**Regalamos el precio.** 21 de las 31 ventas fueron con descuento y 18 de ellas fueron de leads calientes, que ya mostraban interés. El precio promedio fue de $3,111 contra $3,999 de lista.'),
      vineta('**Pagamos mensajes que nadie contesta.** La mitad de las plantillas pagadas (638) fue a tibios y fríos y solo 15 obtuvieron respuesta. Meta retuvo mensajes a 28 leads «para mantener la salud del ecosistema».'),
      vineta('**No personalizamos ni aprendemos.** Solo el 34% dice a qué se dedica, ningún caliente recibió su ruta con audio corto y el 91% de los Perdidos se cierra con «No contestaron».'),
      vineta('**Las señales sí dicen quién compra.** Quien abre su ruta compra 2.9 veces más (5.5% contra 1.9%). Con un mensaje de una persona en la primera hora compra el 5.6%; después de un día, el 0.5%.', 20),
      ceja('02 · QUIÉN COMPRA'), encabezado('Las ventas están en los calientes; las ofertas, en todos'),
      leyenda(),
      barra('Leads', '1,100', [50, 25, 25]),
      barra('Ventas', '31', [87, 10, 3]),
      barra('Recibieron la oferta de $2,799', '909', [48, 26, 26]),
      barra('Plantillas pagadas (estimado)', '1,270', [50, 23, 27]),
      texto('Tibios y fríos son **la mitad de los leads** y dejaron **4 de las 31 ventas**, pero recibieron 470 ofertas de $2,799 y 638 plantillas pagadas.', 30, 18),
      nota('Caliente: en sus primeras 24 h preguntó precio, dijo a qué se dedica, abrió su ruta o dijo que le interesa. Tibio: contestó sin esas señales. Frío: no volvió a escribir. Plantillas pagadas: estimado con las reglas de Meta.', 0),
      salto()]
# Hoja 2
verde, rojo = '2E7D32', ROSA
filas = [
    ['Leads medidos', '620', '1,100', 'Tres semanas de operación'],
    ['**Leads con el problema del proyecto**', '87%', '**93%**', 'Sigue · 98.6% con 7 días o más'],
    ['Tibios y fríos que reciben la oferta de $2,799', '74%', '86%', 'Sigue · con 7 días: 99% y 93%'],
    ['Plantillas pagadas por lead (primeros 7 días)', '1.16', '1.31', 'Más gasto'],
    ['Respuesta a las plantillas pagadas', '7.6%', '4.9%', 'Empeoró'],
    ['Ventas con descuento', '15 de 19', '21 de 31', 'Sigue'],
    ['**Precio promedio de venta**', '$3,438', '**$3,111**', 'Bajó $327 por venta'],
    ['Conversión (ventas ÷ leads)', '3.1%', '2.8%', 'Sin cambio'],
    ['Dejan de escribir en el saludo o antes', '51%', '53%', 'Sigue'],
    ['Dicen a qué se dedican', '38%', '34%', 'Bajó'],
    ['Leads a los que nunca escribió una persona', '13%', '7%', 'Mejoró'],
]
col = {}
for i, f in enumerate(filas):
    col[(i, 3)] = verde if f[3] == 'Mejoró' else (GRIS if f[3] in ('Sin cambio', 'Tres semanas de operación') else rojo)
B += [ceja('03 · COMPARACIÓN CON LA PRIMERA MUESTRA', 0), encabezado('Tres semanas después, el problema sigue igual o peor'),
      texto('La primera muestra (5 al 15 de octubre) se recalculó con el mismo método y coincide lead por lead con la publicada. Si se compara a cada lead en sus primeros 7 días, el resultado es el mismo.', 80, 18),
      tabla([4382, 1500, 1600, 2800], ['Indicador', '5 al 15 oct', '16 oct al 5 nov', 'Lectura'], filas, ['left', 'center', 'center', 'left'], colores=col),
      espacio(40),
      vineta('**Cambiaron detalles:** el primer mensaje del Negativo (30 de octubre) y las esperas, que ahora cuentan solo en horario (4 de noviembre). El equipo dejó a menos leads sin mensaje de una persona.'),
      vineta('**No cambió lo de fondo:** las ofertas por tiempo con «Nos quedan 4 lugares» y «la cerramos hoy» siguen en los tres embudos, y la clasificación, la ruta con audio corto y las nuevas plantillas siguen en pausa. **Los ajustes sueltos no movieron el problema.**', 20),
      ceja('04 · LO QUE FALTA PARA ARRANCAR'), encabezado('Seis pasos y un piloto de 3 semanas en Manufactura y Calidad'),
      tabla([500, 6382, 1700, 1700], ['#', 'Qué se hace', 'Para cuándo', 'Cómo está hoy'], [
          ['1', 'Activar el filtro de inicio y guardar la temperatura en el CRM', '13 nov', 'Diseñado'],
          ['2', 'Quitar descuentos y «últimos lugares» a tibios y fríos', '13 nov', 'Por configurar'],
          ['3', 'Enviar a los calientes su ruta en PDF y un audio de 1 minuto', '13 nov', 'Construido'],
          ['4', 'Aprobar en Meta las plantillas que reabren la conversación', '18 nov', 'Redactadas'],
          ['5', 'Capacitar al equipo en el guion y las 10 respuestas a dudas', '18 nov', 'Guion listo'],
          ['6', '**Piloto en Manufactura y Calidad**, medido contra esta línea base', '19 nov al 10 dic', 'Decisión: 11 dic'],
      ], ['center', 'left', 'left', 'left']),
      espacio(60),
      recuadro('LO QUE PEDIMOS', [
          '**Autorizar hoy el arranque**: los seis pasos y el piloto de 3 semanas en Manufactura y Calidad. La meta es bajar los leads con el problema de 93% a 10% o menos y subir las ventas a precio de lista (hoy 10 de 31). Si funciona, se extiende a ISO + Calidad y a Core Tools Premium.',
          'Lo que está en juego: si la mitad de las ventas con descuento se cerrara a precio de lista, serían **unos $20,700 más al mes** solo en estos tres embudos, además del ahorro en plantillas y en tiempo del asesor.']),
      nota('Fuentes: CRM de SyS en solo lectura; libro «Actualización As Is · 3 embudos», corte 5 nov 2026, 13:30 h. Primera muestra recalculada con el mismo método (620 de 628 leads). El monto en juego es un estimado, no una promesa.', 0, 60)]

# ----------------------------------------------------------------- armado
if os.path.exists(TMP): shutil.rmtree(TMP)
shutil.copytree(SRC, TMP)
d = open(os.path.join(TMP, 'word/document.xml')).read()
ini = d[:d.find('<w:body>') + len('<w:body>')]
sect = d[d.find('<w:sectPr'):]
open(os.path.join(TMP, 'word/document.xml'), 'w').write(ini + ''.join(B) + sect)
for f in ('footer1.xml', 'footer2.xml'):
    fp = os.path.join(TMP, 'word', f); x = open(fp).read()
    x = x.replace('Clasificación de leads · Propuesta para Dirección · Uso interno', 'Clasificación de leads · Actualización para Dirección · Uso interno')
    open(fp, 'w').write(x)
cm = os.path.join(TMP, 'word/comments.xml'); x = open(cm).read()
open(cm, 'w').write(re.sub(r'(<w:comments[^>]*>).*(</w:comments>)', r'\1\2', x, flags=re.S))
for f in ('commentsExtended.xml', 'commentsIds.xml', 'commentsExtensible.xml'):
    fp = os.path.join(TMP, 'word', f)
    if os.path.exists(fp): os.remove(fp)
core = os.path.join(TMP, 'docProps/core.xml')
if os.path.exists(core):
    x = open(core).read()
    x = re.sub(r'<dc:title>.*?</dc:title>', '<dc:title>Clasificación de leads · Actualización para Dirección</dc:title>', x)
    open(core, 'w').write(x)
if os.path.exists(OUT): os.remove(OUT)
z = zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED)
z.write(os.path.join(TMP, '[Content_Types].xml'), '[Content_Types].xml')
for root, _, files in os.walk(TMP):
    files = [f for f in files if not (root == TMP and f == '[Content_Types].xml')]
    for f in files:
        full = os.path.join(root, f); arc = os.path.relpath(full, TMP)
        z.write(full, arc)
z.close()
print('ok', OUT)
