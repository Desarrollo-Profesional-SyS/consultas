# Descarga SOLO LECTURA (GET) de los leads de 3 embudos del CRM, desde el 5 de octubre de 2026.
import json, os, sys, time, threading, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor
B = 'https://crm-web-production-3b33.up.railway.app'
D = sys.argv[1]
CK = open(os.path.join(D, 'cookie_header.txt')).read().strip()
lock = threading.Lock(); last = [0.0]
def get(path, params=None):
    url = B + path + ('?' + urllib.parse.urlencode(params) if params else '')
    for i in range(6):
        with lock:
            w = 0.12 - (time.time() - last[0])
            if w > 0: time.sleep(w)
            last[0] = time.time()
        try:
            req = urllib.request.Request(url, method='GET', headers={'Cookie': CK})
            with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(10 * (i + 1)); continue
            if e.code in (401, 403): raise
            time.sleep(3 * (i + 1))
        except Exception:
            time.sleep(3 * (i + 1))
    raise RuntimeError(url)
EMBUDOS = {'iso': '89135bd0-48c8-4f02-9ddc-670cfac66528', 'ct': '77c0bda0-5cda-4898-9c8c-b44a3efc18ff', 'mc': '347eff8b-97e6-4652-bf38-de1e4a66b296'}
DESDE = '2026-10-05T06:00:00'
os.makedirs(os.path.join(D, 'bots'), exist_ok=True)
for k, pid in EMBUDOS.items():
    json.dump(get(f'/embudos/{pid}/automatizaciones'), open(os.path.join(D, 'bots', k + '.json'), 'w'), ensure_ascii=False)
convs = {}
for k, pid in EMBUDOS.items():
    antes = None; n = 0
    while True:
        p = {'bandeja': 'todas', 'embudo': pid, 'limite': 100}
        if antes: p['antes'] = antes
        r = get('/conversaciones', p)
        for c in r['items']:
            convs[c['id']] = {**c, '_embudo': k}; n += 1
        antes = r['siguiente']
        if not antes or not r['items']: break
    print(k, n, flush=True)
json.dump(list(convs.values()), open(os.path.join(D, 'convs.json'), 'w'), ensure_ascii=False)
ids = [c['id'] for c in convs.values() if (c.get('createdAt') or '') >= DESDE]
print('desde 5 oct:', len(ids), 'de', len(convs), flush=True)
os.makedirs(os.path.join(D, 'det'), exist_ok=True)
def detalle(cid):
    f = os.path.join(D, 'det', cid + '.json')
    if os.path.exists(f): return
    mov = get(f'/conversaciones/{cid}/movimientos')
    msgs = []; antes = None
    while True:
        p = {'limite': 100}
        if antes: p['antes'] = antes
        r = get(f'/conversaciones/{cid}/mensajes', p)
        msgs = r['mensajes'] + msgs
        if not r.get('hayMasAntiguos') or not r['mensajes']: break
        nuevo = r['mensajes'][0]['timestampMeta']
        if not nuevo or nuevo == antes: break
        antes = nuevo
    tar = get(f'/conversaciones/{cid}/tareas')
    full = get(f'/conversaciones/{cid}')
    info = {k: full.get(k) for k in ('compras', 'cierres', 'campos', 'razonPerdida', 'asignado', 'presupuesto', 'contestadaPorPersona', 'createdAt')}
    json.dump({'mov': mov, 'msgs': msgs, 'tareas': tar, 'info': info}, open(f + '.tmp', 'w'), ensure_ascii=False)
    os.replace(f + '.tmp', f)
done = [0]
def w(cid):
    try: detalle(cid)
    except Exception as e: print('ERR', cid, e, flush=True)
    done[0] += 1
    if done[0] % 200 == 0: print('det', done[0], '/', len(ids), flush=True)
with ThreadPoolExecutor(8) as ex: list(ex.map(w, ids))
print('ok', len(ids), flush=True)
