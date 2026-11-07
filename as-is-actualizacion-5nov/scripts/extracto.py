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
B += [banner('EJE CURSOS  /  EXTRACTO PARA DIRECCIÓN'), espacio(100),
      titulo('El método actual pierde a 1 de cada 3'),
      subtitulo('Qué pasa con el lead que dice a qué se dedica y recibe el audio de casi 2 minutos con 2 links de cursos.'),
      base('Base: 1,720 leads de ISO + Calidad, Manufactura y Calidad y Core Tools Premium · 5 oct al 5 nov de 2026 · CRM en solo lectura'),
      recuadro('EN POCAS PALABRAS', [
          'Hoy la venta depende de un paso al que llega solo **1 de cada 3 leads**: decir a qué se dedica. A quien lo dice, el equipo le manda en unos 6 minutos un audio de 1 min 42 s y 2 links de cursos sueltos.',
          'De ellos, **solo el 21% contesta a la recomendación**, el **34% ya no vuelve a escribir** y el resto contesta hasta que le llegan las facilidades de pago, un seguimiento o una oferta. Quien no contesta no compra: **0 ventas de 149**. Las dos mediciones (octubre y noviembre) dan casi lo mismo: no es una mala racha, es el método.']),
      espacio(60),
      cifras([('35%', 'de los leads dice a qué se dedica (598 de 1,720)', MAGENTA),
              ('1:42', 'dura el audio (mediana); menos del 1% dura 1 minuto o menos', ROSA),
              ('21%', 'contesta a la recomendación misma (audio y links)', MAGENTA),
              ('34%', 'no vuelve a escribir en 7 días; ninguno compró', ROSA)]),
      ceja('01 · EL SALUDO Y EL FILTRO'), encabezado('La mayoría nunca llega a la recomendación'),
      tabla([4482, 1900, 1900, 2000], ['Paso', '5 al 15 oct', '16 oct al 5 nov', 'Las dos'], [
          ['Leads que entraron', '620', '1,100', '1,720'],
          ['Contestan el saludo', '67%', '65%', '66%'],
          ['**Dicen a qué se dedican**', '38%', '33%', '**35%**'],
          ['Reciben la recomendación (audio y 2 links)', '92%', '93%', '93%'],
          ['Contestan en 24 h después del audio', '60%', '59%', '59%'],
          ['Compran, de quienes dijeron a qué se dedican', '3.9%', '5.2%', '4.7%'],
          ['Compran, del resto de los leads', '2.6%', '1.6%', '2.0%'],
      ], ['left', 'center', 'center', 'center']),
      texto('Quien dice a qué se dedica **compra 2.4 veces más** que el resto. El filtro de inicio busca que más leads lleguen a ese punto y que el asesor atienda primero a los que muestran interés.', 40, 18),
      nota('La recomendación se mide desde que el lead dice a qué se dedica; «compran» cuenta las ventas hasta el corte de cada medición (15 oct y 5 nov).', 0, 30),
      salto()]
# Hoja 2
B += [ceja('02 · LA RECOMENDACIÓN ACTUAL', 0), encabezado('Qué pasa en los 7 días después del audio'),
      texto('La recomendación de hoy: el mensaje «Te mando un audio rapidito…», un audio de casi 2 minutos, 2 links de cursos y la pregunta «¿Cómo ves la propuesta?». Seguimos 7 días a los 440 leads que la recibieron con tiempo suficiente para ver qué hicieron después.', 70, 18),
      tabla([4682, 1300, 1400, 1700, 1200], ['Qué hizo el lead', '5 al 15 oct', '16 oct al 5 nov', 'Las dos', 'Ventas'], [
          ['**Contestó a la recomendación** (audio y links)', '21%', '21%', '93 · 21%', '7'],
          ['Contestó, pero hasta el mensaje de facilidades de pago que el bot manda minutos después', '31%', '30%', '134 · 30%', '9'],
          ['Contestó más adelante, con un seguimiento (10 h después)', '9%', '9%', '40 · 9%', '4'],
          ['Contestó hasta que le llegó una oferta (2.6 días después)', '5%', '6%', '24 · 5%', '3'],
          ['**No volvió a escribir en 7 días**', '34%', '33%', '**149 · 34%**', '**0**'],
      ], ['left', 'center', 'center', 'center', 'center'], total=['Total', '215', '225', '440', '23']),
      espacio(40),
      recuadro('CÓMO SE LEE LA TABLA', [
          '**Contestó a la recomendación:** escribió en las 2 h siguientes al audio, antes de que llegara cualquier mensaje automático.',
          '**Facilidades de pago:** al pasar al lead a 1.3, el bot le manda solo, a los pocos minutos, las formas de pago y la «llamadita». Ese lead contestó a ese mensaje, no al audio.',
          '**Seguimiento u oferta:** contestó horas o días después a un mensaje del Negativo o del equipo; cuenta como «oferta» si ese mensaje traía precio ($3,799 o $2,799).',
          '**No volvió a escribir:** ningún mensaje en los 7 días siguientes al audio. **Ventas:** hasta el corte de cada medición (15 de octubre y 5 de noviembre).']),
      espacio(30),
      vineta('**El audio informa, no persuade.** Dura 1 min 42 s (el 62% pasa de minuto y medio) y explica lo mismo a todos. Los 2 links son páginas de cursos sueltas, sin su nombre ni su ruta.'),
      vineta('**Se cierra con descuento.** El 97% recibió una oferta en los 7 días siguientes al audio, incluso el 99% de los que ya no contestaron. 18 de las 23 ventas fueron con descuento.'),
      vineta('**Es estable.** Las dos mediciones dan la misma foto, con 1,720 leads en total: el resultado depende del método, no del mes.', 20),
      ceja('03 · LO QUE PROPONEMOS', 140), encabezado('Ruta en PDF y audio corto que persuade'),
      tabla([2400, 3941, 3941], ['', 'Hoy', 'Con la ruta personalizada'], [
          ['**Qué recibe**', 'Audio de 1 min 42 s y 2 links de cursos sueltos', 'PDF con su nombre, su ocupación y su ruta, y un audio de 1 minuto como máximo'],
          ['**Para qué el audio**', 'Explicar cómo funcionan los cursos', 'Persuadir: por qué le conviene y un primer paso pequeño'],
          ['**A quién**', 'A quien dice a qué se dedica (35%)', 'Al lead caliente que identifica el filtro de inicio'],
          ['**Ofertas**', 'Por tiempo, a casi todos (97%)', 'Solo cuando hay señal de compra'],
          ['**Qué se mide**', '21% contesta a la recomendación; 34% no vuelve', 'Subir la respuesta y bajar el silencio'],
      ], ['left', 'left', 'left']),
      nota('Fuente: CRM de SyS en solo lectura. Leads de ISO + Calidad, Manufactura y Calidad y Core Tools Premium.', 0, 60)]

# ----------------------------------------------------------------- armado
if os.path.exists(TMP): shutil.rmtree(TMP)
shutil.copytree(SRC, TMP)
d = open(os.path.join(TMP, 'word/document.xml')).read()
ini = d[:d.find('<w:body>') + len('<w:body>')]
sect = d[d.find('<w:sectPr'):]
open(os.path.join(TMP, 'word/document.xml'), 'w').write(ini + ''.join(B) + sect)
for f in ('footer1.xml', 'footer2.xml'):
    fp = os.path.join(TMP, 'word', f); x = open(fp).read()
    x = x.replace('Clasificación de leads · Propuesta para Dirección · Uso interno', 'Clasificación de leads · Extracto para Dirección · Uso interno')
    open(fp, 'w').write(x)
cm = os.path.join(TMP, 'word/comments.xml'); x = open(cm).read()
open(cm, 'w').write(re.sub(r'(<w:comments[^>]*>).*(</w:comments>)', r'\1\2', x, flags=re.S))
for f in ('commentsExtended.xml', 'commentsIds.xml', 'commentsExtensible.xml'):
    fp = os.path.join(TMP, 'word', f)
    if os.path.exists(fp): os.remove(fp)
core = os.path.join(TMP, 'docProps/core.xml')
if os.path.exists(core):
    x = open(core).read()
    x = re.sub(r'<dc:title>.*?</dc:title>', '<dc:title>Clasificación de leads · Extracto para Dirección</dc:title>', x)
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
