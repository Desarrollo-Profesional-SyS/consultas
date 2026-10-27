# Solo lectura: GET /conversaciones/:id para traer las compras (sistema de ventas) de cada lead.
import json, os, sys, time, threading, http.cookiejar, urllib.request
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
B = 'https://crm-web-production-3b33.up.railway.app'
D = sys.argv[1]
cj = http.cookiejar.MozillaCookieJar(os.path.join(D, 'cookies.txt')); cj.load(ignore_discard=True, ignore_expires=True)
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
lock = threading.Lock(); last = [0.0]
def get(path):
    for i in range(5):
        with lock:
            w = 0.12 - (time.time() - last[0])
            if w > 0: time.sleep(w)
            last[0] = time.time()
        try:
            with op.open(urllib.request.Request(B + path, method='GET'), timeout=60) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(10 * (i + 1)); continue
            raise
        except Exception:
            time.sleep(3 * (i + 1))
    raise RuntimeError(path)
L = pd.read_pickle(os.path.join(D, 'leads.pkl'))
E = pd.read_pickle(os.path.join(D, 'entradas13.pkl'))
ids = sorted(set(L[L.recibio_pregunta].id) | set(E.id))
os.makedirs(os.path.join(D, 'conv'), exist_ok=True)
def w(cid):
    f = os.path.join(D, 'conv', cid + '.json')
    if os.path.exists(f): return
    d = get(f'/conversaciones/{cid}')
    json.dump({k: d.get(k) for k in ('compras', 'cierres', 'campos', 'razonPerdida', 'asignado', 'presupuesto', 'contestadaPorPersona')}, open(f, 'w'), ensure_ascii=False)
with ThreadPoolExecutor(8) as ex: list(ex.map(w, ids))
print('ok', len(ids))
