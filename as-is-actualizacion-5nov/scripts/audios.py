# Duración de las notas de voz del equipo. Las que pesan más de 210 KB duran más de 60 s
# (la tasa más alta medida fue 3.4 KB/s), así que solo se bajan y se miden las ligeras.
import json, os, subprocess, urllib.request, glob, sys
from concurrent.futures import ThreadPoolExecutor
D = sys.argv[1]
B = 'https://crm-web-production-3b33.up.railway.app'
CK = open(os.path.join(D, 'cookie_header.txt')).read().strip()
LIMITE = 210_000
TASA = 3130  # bytes por segundo, mediana de 40 audios medidos
os.makedirs(os.path.join(D, 'audios'), exist_ok=True)
cache_f = os.path.join(D, 'audios', 'duraciones.json')
cache = json.load(open(cache_f)) if os.path.exists(cache_f) else {}
pend = set()
for f in glob.glob(os.path.join(D, 'det', '*.json')):
    for m in json.load(open(f))['msgs']:
        a = m.get('archivo') or {}
        if m['tipo'] == 'audio' and m['direccion'] == 'saliente' and not m.get('automatico') and a.get('id') and a.get('tamano', 0) <= LIMITE and a['id'] not in cache:
            pend.add(a['id'])
def medir(aid):
    p = os.path.join(D, 'audios', aid + '.ogg')
    if not os.path.exists(p):
        data = urllib.request.urlopen(urllib.request.Request(f'{B}/archivos/{aid}', headers={'Cookie': CK}), timeout=60).read()
        open(p, 'wb').write(data)
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip()
    return aid, float(out) if out else None
with ThreadPoolExecutor(4) as ex:
    for aid, dur in ex.map(medir, sorted(pend)):
        cache[aid] = dur
json.dump(cache, open(cache_f, 'w'))
print('medidos', len(pend), 'en cache', len(cache))
