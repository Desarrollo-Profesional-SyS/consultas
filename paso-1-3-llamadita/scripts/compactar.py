# Compacta un xlsx de openpyxl: fuente por defecto Poppins y, en las hojas de
# datos, quita la referencia de cada celda cuando es la siguiente de la anterior.
import re, sys, zipfile
src, dst, quitar_r = sys.argv[1], sys.argv[2], sys.argv[3] == '1'
zin = zipfile.ZipFile(src)
wbx = zin.read('xl/workbook.xml').decode()
rels = zin.read('xl/_rels/workbook.xml.rels').decode()
hojas = dict(re.findall(r'<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', wbx))
destino = dict(re.findall(r'Id="([^"]+)"[^>]*Target="/?(?:xl/)?([^"]+)"', rels)) or {}
if not destino:
    destino = {m[1]: m[0] for m in re.findall(r'Target="/?(?:xl/)?([^"]+)"[^>]*Id="([^"]+)"', rels)}
datos = {('xl/' + destino[hojas[n]]) for n in ('Base leads', 'Entradas a 1.3')}
def col_idx(ref):
    letras = re.match(r'[A-Z]+', ref).group(0); n = 0
    for ch in letras: n = n * 26 + ord(ch) - 64
    return n
def compactar_fila(m):
    fila = m.group(0)
    num = int(re.search(r'<row r="(\d+)"', fila).group(1))
    if num < 5: return fila
    prev = [0]
    def celda(mc):
        attrs = mc.group(1)
        ref = re.search(r' r="([A-Z]+\d+)"', attrs).group(1)
        ci = col_idx(ref)
        if ci == prev[0] + 1:
            attrs = re.sub(r' r="[A-Z]+\d+"', '', attrs)
        prev[0] = ci
        return '<c' + attrs
    fila = re.sub(r'<c((?: [a-z]+="[^"]*")*)', celda, fila)
    return re.sub(r' spans="[^"]*"', '', fila)
zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED, compresslevel=9)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == 'xl/styles.xml':
        t = data.decode()
        t = re.sub(r'(<fonts[^>]*>)<font>.*?</font>', r'\1<font><name val="Poppins"/><color rgb="FF330A28"/><sz val="9"/></font>', t, count=1, flags=re.S)
        data = t.encode()
    if quitar_r and it.filename in datos:
        t = data.decode()
        t = re.sub(r'<row [^>]*>.*?</row>', compactar_fila, t, flags=re.S)
        data = t.encode()
    zout.writestr(it, data)
zout.close()
print(datos)

# Segunda pasada: textos en linea -> tabla de textos compartidos (sharedStrings).
import html
z2 = zipfile.ZipFile(dst)
items = [(it, z2.read(it.filename)) for it in z2.infolist()]
z2.close()
sst, idx = [], {}
def a_compartido(m):
    attrs, cuerpo = m.group(1), m.group(2)
    attrs = attrs.replace(' t="inlineStr"', '')
    texto = re.search(r'<t[^>]*>(.*?)</t>', cuerpo, re.S)
    t = texto.group(1) if texto else ''
    if t not in idx:
        idx[t] = len(sst); sst.append(t)
    return f'<c{attrs} t="s"><v>{idx[t]}</v></c>'
salida = []
for it, data in items:
    if it.filename.startswith('xl/worksheets/sheet'):
        t = data.decode()
        t = re.sub(r'<c((?: [a-z]+="[^"]*")*) t="inlineStr"((?: [a-z]+="[^"]*")*)><is>(.*?)</is></c>', lambda m: a_compartido(type('M', (), {'group': lambda self, k: (m.group(1) + m.group(2)) if k == 1 else m.group(3)})()), t, flags=re.S)
        t = t.replace(' t="n">', '>')
        data = t.encode()
    salida.append((it, data))
assert not any(it.filename == 'xl/sharedStrings.xml' for it, _ in salida)
xml_sst = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="%d" uniqueCount="%d">' % (len(sst), len(sst))
xml_sst += ''.join(f'<si><t xml:space="preserve">{s}</t></si>' for s in sst) + '</sst>'
zf = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED, compresslevel=9)
for it, data in salida:
    if it.filename == '[Content_Types].xml':
        data = data.decode().replace('</Types>', '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>').encode()
    if it.filename == 'xl/_rels/workbook.xml.rels':
        data = data.decode().replace('</Relationships>', '<Relationship Id="rIdSST1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>').encode()
    zf.writestr(it, data)
zf.writestr('xl/sharedStrings.xml', xml_sst.encode())
zf.close()
print('textos compartidos', len(sst))
