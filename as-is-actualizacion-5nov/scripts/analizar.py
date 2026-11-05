# Medición As Is de ISO + Calidad, Manufactura y Calidad y Core Tools Premium.
# Lee lo que bajó descargar.py y arma un renglón por lead para un periodo y un corte.
# Uso: analizar.py <dir> <periodo>   periodo = base (5-15 oct) | nuevo (16 oct - corte)
import json, os, re, sys, unicodedata
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import pandas as pd

D = sys.argv[1]
TZ = ZoneInfo('America/Monterrey')
H = timedelta(hours=1)
PERIODOS = {
    'base': (datetime(2026, 10, 5, tzinfo=TZ), datetime(2026, 10, 15, 23, 59, 59, tzinfo=TZ)),
    'nuevo': (datetime(2026, 10, 16, tzinfo=TZ), datetime(2026, 11, 5, 13, 30, tzinfo=TZ)),
}
NOMBRE = {'iso': 'ISO + Calidad', 'mc': 'Manufactura y Calidad', 'ct': 'Core Tools Premium'}
PRUEBAS = {1, 7}
ETAPA_EMBUDO = {}
for _k in ('iso', 'mc', 'ct'):
    for _e in json.load(open(os.path.join(D, 'bots', _k + '.json')))['etapas']:
        if 'entrantes' not in _e['nombre'].lower(): ETAPA_EMBUDO[_e['id']] = _k

def norm(t):
    t = unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', t)

def ts(m):
    v = m.get('timestampMeta') or m.get('createdAt')
    return datetime.fromisoformat(v.replace('Z', '+00:00'))

def grupo(nombre, tipo):
    n = norm(nombre)
    if tipo == 'ganada': return 'GAN'
    if tipo == 'perdida': return 'PER'
    if 'negativo' in n: return 'NEG'
    if n.startswith('1.3') or n.startswith('1.4') or n.startswith('1.5'): return 'FAC'
    if n.startswith('1.2'): return 'S12'
    if n.startswith('1.1'): return 'S11'
    if 'saludo' in n: return 'S1'
    if 'entrantes' in n: return 'ENT'
    if 'stby' in n: return 'STBY'
    if re.match(r'^(2|3|msi)', n): return 'PAGO'
    return 'OTRA'
ORDEN = {'ENT': 0, 'S1': 1, 'S11': 2, 'S12': 3, 'NEG': 3, 'FAC': 4, 'STBY': 4, 'PAGO': 5, 'GAN': 6, 'PER': -1, 'OTRA': -1}

OFERTA = {'3799': re.compile(r'3,?799'), '3400': re.compile(r'3,?400'), '2799': re.compile(r'2,?799'), '1950': re.compile(r'1,?950')}
PIDE_NOMBRE = re.compile(r'tu nombre|como te llamas|me puedes compartir tu nombre')
PREG_AREA = re.compile(r'en que area trabajas|a que te dedicas')
PRECIO = re.compile(r'cost|precio|cuanto|cuesta|pago|pagar|mensualidad|meses|inscrib|promo|descuento|tarjeta|transferencia|deposit|oxxo|apart')
INTERES = re.compile(r'me interesa|interesad|lo quiero|la quiero|quiero (inscrib|tomar|el curso|la membres|los cursos|empezar|iniciar|entrar|adquir|comprar|aprovech)|si quiero|me gustaria (inscrib|tomar|empezar)|como (le hago|me inscribo|puedo inscrib|puedo pagar)|cuando (empieza|inicia|comienza)|me apunto|aparta')
OCUPA = re.compile(r'calidad|produc|operac|operador|operari|supervis|jefe|jefa|gerent|coordin|ingenier|inge |ing\.|estudi|egresad|universi|carrera|semestre|tecnico|tecnica|analista|inspector|auditor|manten|almacen|logist|segurid|proceso|manufactur|planta|maquil|empresa|trabajo en|area de|soy |me dedico|lider|encargad|metrolog|compras|recursos humanos|administra|contad|maestr|docente|desemple|no trabajo|sin empleo|busco empleo|ventas|mejora continua|lean|six sigma|automotri|industria')
LINK = re.compile(r'acaba de abrir|volvio a abrir')
RUTA_GENERICOS = re.compile(r'dc-3 muestra|catalogo|acreditaci|temario|constancia|csf|^f- ?\d|factura|recibo|comprobante')
FECHA_ARCH = re.compile(r'\d{1,2}-\d{1,2}-\d{2,4}')

def es_persona(m): return m['direccion'] == 'saliente' and not m.get('automatico') and not m.get('interno')
def es_bot(m): return m['direccion'] == 'saliente' and m.get('automatico') and not m.get('interno')
def es_saliente(m): return m['direccion'] == 'saliente' and not m.get('interno')

def etapa_en(movs, t):
    g = None
    for mv in movs:
        if mv['_t'] <= t: g = mv['_k']
        else: break
    return g

def lead(c, d, ini, corte, dur_audio):
    msgs = sorted([m for m in d['msgs'] if not m.get('eliminadoAt')], key=ts)
    msgs = [m for m in msgs if ts(m) <= corte]
    ent_all = [m for m in msgs if m['direccion'] == 'entrante']
    if not ent_all: return None
    entrada = ts(ent_all[0])
    if not (ini <= entrada <= corte): return None
    movs = sorted(d['mov'], key=lambda mv: mv['createdAt'])
    for mv in movs:
        mv['_t'] = datetime.fromisoformat(mv['createdAt'].replace('Z', '+00:00'))
        mv['_k'] = grupo((mv['hacia'] or {}).get('nombre', ''), (mv['hacia'] or {}).get('tipo'))
    movs = [mv for mv in movs if mv['_t'] <= corte]
    # Embudo: el primero de los tres al que entró antes del corte (sin contar «Leads entrantes»)
    primera = next((mv for mv in movs if 'entrantes' not in ((mv['hacia'] or {}).get('nombre') or '').lower()), None)
    emb = ETAPA_EMBUDO.get((primera['hacia'] or {}).get('id')) if primera else None
    if emb is None: return None
    r = {'id': c['id'], 'lead': c['numero'], 'embudo': NOMBRE[emb], 'entrada': entrada}
    hl = entrada.astimezone(TZ)
    r['fuera_horario'] = hl.hour < 9 or hl.hour >= 21
    r['semana'] = (hl.date() - timedelta(days=hl.weekday())).isoformat()
    iso = hl.isocalendar(); r['semana_iso'] = f'{iso[0]}-S{iso[1]:02d}'
    r['dias_al_corte'] = (corte - entrada).total_seconds() / 86400
    ent = ent_all
    bot = [m for m in msgs if es_bot(m)]
    per = [m for m in msgs if es_persona(m)]
    sal = [m for m in msgs if es_saliente(m)]
    r['msgs_lead'] = len(ent); r['msgs_bot'] = len(bot); r['msgs_persona'] = len(per)
    # Saludo
    pide = [m for m in bot if PIDE_NOMBRE.search(norm(m.get('texto')))]
    t_pide = ts(pide[0]) if pide else None
    sale_saludo = next((mv['_t'] for mv in movs if ORDEN.get(mv['_k'], -1) >= 2 or mv['_k'] in ('PER',)), None)
    if t_pide:
        resp = [m for m in ent if ts(m) > t_pide and (sale_saludo is None or ts(m) <= sale_saludo + timedelta(minutes=1))]
        r['contesto_saludo'] = bool(resp)
    else:
        r['contesto_saludo'] = len(ent) > 1
    r['escribio_despues'] = len(ent) > 1
    # Dónde dejó de escribir
    t_ult = ts(ent[-1])
    g_ult = etapa_en(movs, t_ult) or 'S1'
    if len(ent) == 1: r['dejo_en'] = 'Solo su primer mensaje'
    elif g_ult in ('S1', 'ENT', None): r['dejo_en'] = 'Saludo: contestó y no volvió'
    elif g_ult in ('S11', 'S12'): r['dejo_en'] = '1.2 Lista de cursos'
    elif g_ult == 'NEG': r['dejo_en'] = 'Negativo'
    elif g_ult in ('FAC', 'STBY'): r['dejo_en'] = 'Facilidades de pago'
    elif g_ult == 'PAGO': r['dejo_en'] = 'Forma o medio de pago'
    elif g_ult == 'PER': r['dejo_en'] = 'Ya marcado como Perdido'
    elif g_ult == 'GAN': r['dejo_en'] = 'Compró'
    else: r['dejo_en'] = 'Otra etapa'
    if r_venta_temp := any(mv['_k'] == 'GAN' for mv in movs[-1:]): r['dejo_en'] = 'Compró'
    r['dejo_en_saludo'] = r['dejo_en'] in ('Solo su primer mensaje', 'Saludo: contestó y no volvió')
    ks = {mv['_k'] for mv in movs}
    r['llego_facilidades'] = bool(ks & {'FAC', 'STBY', 'PAGO', 'GAN'})
    r['llego_pago'] = bool(ks & {'PAGO', 'GAN'})
    r['entro_negativo'] = 'NEG' in ks
    # Personas
    r['h_1er_msg_persona'] = (ts(per[0]) - entrada).total_seconds() / 3600 if per else None
    r['nunca_persona'] = not per
    r['audio_equipo'] = any(m['tipo'] == 'audio' for m in per)
    # Ocupación (24 h después de la pregunta)
    preg = [m for m in bot if PREG_AREA.search(norm(m.get('texto')))]
    r['recibio_pregunta_area'] = bool(preg)
    if preg:
        tq = ts(preg[0])
        resp = [m for m in ent if tq < ts(m) <= tq + timedelta(hours=24)]
        r['contesto_area'] = any(OCUPA.search(' ' + norm(m.get('texto')) + ' ') for m in resp)
    else:
        r['contesto_area'] = None
    # Links abiertos
    links = [m for m in msgs if m.get('interno') and LINK.search(norm(m.get('texto')))]
    r['abrio_link'] = bool(links)
    # Ofertas
    ofertas = [m for m in sal if any(p.search(m.get('texto') or '') for p in OFERTA.values())]
    r['recibio_oferta'] = bool(ofertas)
    for k, p in OFERTA.items():
        r['recibio_' + k] = any(p.search(m.get('texto') or '') for m in sal)
    r['oferta_1_bot'] = bool(ofertas[0].get('automatico')) if ofertas else None
    r['h_1a_oferta'] = (ts(ofertas[0]) - entrada).total_seconds() / 3600 if ofertas else None
    # Temperatura en las primeras 24 h (sin contar su primer mensaje, que viene del anuncio)
    lim = entrada + timedelta(hours=24)
    ent24 = [m for m in ent[1:] if ts(m) <= lim]
    txt24 = ' '.join(' ' + norm(m.get('texto')) + ' ' for m in ent24)
    s_precio = bool(PRECIO.search(txt24))
    s_ocupa = False
    if preg:
        tq = ts(preg[0])
        s_ocupa = any(OCUPA.search(' ' + norm(m.get('texto')) + ' ') for m in ent24 if ts(m) > tq)
    s_link = any(ts(m) <= lim for m in links)
    s_interes = bool(INTERES.search(txt24))
    if s_precio or s_ocupa or s_link or s_interes: temp = 'Caliente'
    elif ent24: temp = 'Tibio'
    else: temp = 'Frío'
    r['temperatura'] = temp
    r['senal_precio'], r['senal_ocupacion'], r['senal_link'], r['senal_interes'] = s_precio, s_ocupa, s_link, s_interes
    # Plantillas pagadas (estimado): salida fuera de la ventana de 24 h y después de las 72 h del anuncio
    plant, prev, i_ent = [], None, 0
    for m in sal:
        t = ts(m)
        ult_ent = max((ts(e) for e in ent if ts(e) < t), default=None)
        if ult_ent is None or t - ult_ent <= timedelta(hours=24): continue
        if prev is not None and t - prev < timedelta(minutes=3):
            prev = t; continue
        prev = t
        plant.append(m)
    pag = [m for m in plant if ts(m) > entrada + timedelta(hours=72)]
    def respondio(m):
        t = ts(m)
        return any(t < ts(e) <= t + timedelta(hours=24) for e in ent)
    r['plantillas'] = len(plant)
    r['plantillas_pagadas'] = len(pag)
    r['plantillas_pagadas_resp'] = sum(respondio(m) for m in pag)
    # Ruta personalizada (PDF con su nombre) y audio corto de una persona
    docs = [m for m in per if m['tipo'] == 'documento']
    rutas = [m for m in docs if FECHA_ARCH.search(norm((m.get('archivo') or {}).get('nombre'))) and not RUTA_GENERICOS.search(norm((m.get('archivo') or {}).get('nombre')))]
    r['ruta_pdf'] = bool(rutas)
    r['ruta_pdf_nombre'] = (rutas[0].get('archivo') or {}).get('nombre') if rutas else None
    auds = [m for m in per if m['tipo'] == 'audio']
    durs = [dur_audio(m) for m in auds]
    r['n_audios_equipo'] = len(auds)
    r['dur_1er_audio_s'] = durs[0] if durs else None
    r['audio_corto'] = any(x is not None and x <= 60 for x in durs)
    # Salud del número ante Meta
    errs = [str(m.get('error') or '') for m in sal if m.get('estado') == 'fallido' or m.get('error')]
    r['meta_retenido'] = any('healthy ecosystem' in e for e in errs)
    r['baja_marketing'] = any('stop receiving marketing' in e for e in errs)
    r['envios_fallidos'] = sum(1 for m in sal if m.get('estado') == 'fallido')
    # Estado al corte
    k_fin = movs[-1]['_k'] if movs else 'S1'
    r['estado'] = 'Ganado' if k_fin == 'GAN' else ('Perdido' if k_fin == 'PER' else 'Abierto')
    r['estuvo_perdido'] = 'PER' in ks
    per_movs = [mv for mv in movs if mv['_k'] == 'PER']
    r['perdido_por'] = (('Persona' if per_movs[-1]['origen'] == 'manual' else 'Bot') if r['estado'] == 'Perdido' else None)
    r['razon_perdida'] = (d['info'].get('razonPerdida') or 'Sin razón') if r['estado'] == 'Perdido' else None
    r['h_a_perdido'] = (per_movs[0]['_t'] - entrada).total_seconds() / 3600 if per_movs else None
    r['escribio_en_perdido'] = any(any(mv['_t'] < ts(m) for mv in per_movs) for m in ent) if per_movs else False
    # Venta y precio
    compras = [v for v in ((d['info'].get('compras') or {}).get('compras') or []) if not v.get('cancelada') and v.get('fecha', '9999') <= corte.astimezone(TZ).date().isoformat()]
    r['venta'] = r['estado'] == 'Ganado'
    precio = None
    if r['venta']:
        precio = compras[0]['monto'] if compras else d['info'].get('presupuesto')
    r['precio'] = precio
    r['precio_lista'] = (precio is not None and precio >= 3999) if r['venta'] else None
    r['venta_estuvo_perdido'] = r['venta'] and r['estuvo_perdido']
    r['h_a_venta'] = (next(mv['_t'] for mv in movs if mv['_k'] == 'GAN') - entrada).total_seconds() / 3600 if r['venta'] else None
    r['asignado'] = (d['info'].get('asignado') or {}).get('nombre')
    return r

def cargar(periodo, dur_audio=lambda m: None):
    ini, corte = PERIODOS[periodo]
    convs = json.load(open(os.path.join(D, 'convs.json')))
    filas = []
    for c in convs:
        if c['numero'] in PRUEBAS and c['_embudo'] == 'iso': continue
        f = os.path.join(D, 'det', c['id'] + '.json')
        if not os.path.exists(f): continue
        r = lead(c, json.load(open(f)), ini, corte, dur_audio)
        if r: filas.append(r)
    return pd.DataFrame(filas)

def dur_audio_desde_cache():
    f = os.path.join(D, 'audios', 'duraciones.json')
    cache = json.load(open(f)) if os.path.exists(f) else {}
    def dur(m):
        a = m.get('archivo') or {}
        if a.get('id') in cache: return cache[a['id']]
        if a.get('tamano', 0) > 210_000: return a['tamano'] / 3130
        return None
    return dur

if __name__ == '__main__':
    L = cargar(sys.argv[2], dur_audio_desde_cache())
    L.to_pickle(os.path.join(D, f'leads_{sys.argv[2]}.pkl'))
    print(len(L))
