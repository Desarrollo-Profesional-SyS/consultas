// Una sola forma de leer y escribir el estado compartido del juego, venga de
// Firebase (en vivo, entre celulares) o del modo ensayo local (pestañas de un
// mismo navegador). Todas las páginas usan solo esta interfaz:
//
//   store.uid                 identidad de este navegador
//   store.on(path, cb)        escucha un nodo; devuelve la función para dejar de escuchar
//   store.get(path)           lee una vez
//   store.set / update / remove
//   store.now()               hora del servidor en milisegundos
//   store.onConnection(cb)    true/false cuando cambia la conexión
//   store.onDisconnectSet(path, value)  qué escribir si este navegador se desconecta
import { FIREBASE_CONFIG } from './config.js';

export async function openStore() {
  const forceLocal = new URLSearchParams(location.search).has('ensayo');
  if (FIREBASE_CONFIG && !forceLocal) {
    const { FirebaseStore } = await import('./store-firebase.js');
    const s = new FirebaseStore(FIREBASE_CONFIG);
    await s.init();
    return s;
  }
  const s = new LocalStore();
  await s.init();
  return s;
}

const split = (p) => String(p).split('/').filter(Boolean);
const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const randomId = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

// ---------- Modo ensayo local ----------
// Guarda el árbol en localStorage y avisa a las demás pestañas con BroadcastChannel.
// Cada pestaña es un "dispositivo" distinto (la identidad vive en sessionStorage).
class LocalStore {
  mode = 'local';
  KEY = 'te-acuerdas-ensayo';

  async init() {
    try { this.uid = sessionStorage.getItem('ta-uid'); } catch {}
    if (!this.uid) {
      this.uid = 'l' + randomId();
      try { sessionStorage.setItem('ta-uid', this.uid); } catch {}
    }
    this.tree = this.load();
    this.listeners = new Set();
    this.disconnects = [];
    this.chan = new BroadcastChannel(this.KEY);
    this.chan.onmessage = (e) => {
      const { op, path, value } = e.data || {};
      this.apply(op, path, value, false);
    };
    addEventListener('pagehide', () => {
      for (const [path, value] of this.disconnects) this.set(path, value);
    });
  }

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; }
  }

  persist() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.tree)); } catch {}
  }

  read(path) {
    let node = this.tree;
    for (const k of split(path)) {
      if (node == null || typeof node !== 'object') return null;
      node = node[k];
    }
    return node === undefined ? null : node;
  }

  write(path, value) {
    const keys = split(path);
    if (!keys.length) { this.tree = value ?? {}; return; }
    let node = this.tree;
    for (const k of keys.slice(0, -1)) {
      if (node[k] == null || typeof node[k] !== 'object') node[k] = {};
      node = node[k];
    }
    const last = keys[keys.length - 1];
    if (value === null || value === undefined) delete node[last];
    else node[last] = value;
  }

  apply(op, path, value, broadcast = true) {
    if (op === 'set') this.write(path, clone(value));
    else if (op === 'update') for (const [k, v] of Object.entries(value || {})) this.write(`${path}/${k}`, clone(v));
    if (broadcast) {
      this.persist();
      this.chan.postMessage({ op, path, value });
    }
    const changed = split(path).join('/');
    const extra = op === 'update' ? Object.keys(value || {}).map((k) => split(`${path}/${k}`).join('/')) : [changed];
    for (const l of this.listeners) {
      const lp = l.path;
      const hit = extra.some((c) => c === lp || c.startsWith(lp + '/') || lp.startsWith(c + '/') || lp === '');
      if (hit) l.fire();
    }
  }

  on(path, cb) {
    const l = { path: split(path).join('/'), fire: () => cb(clone(this.read(path))) };
    this.listeners.add(l);
    queueMicrotask(l.fire);
    return () => this.listeners.delete(l);
  }

  async get(path) { return clone(this.read(path)); }
  async set(path, value) { this.apply('set', path, value); }
  async update(path, patch) { this.apply('update', path, patch); }
  async remove(path) { this.apply('set', path, null); }
  now() { return Date.now(); }
  onConnection(cb) { queueMicrotask(() => cb(true)); return () => {}; }
  onDisconnectSet(path, value) { this.disconnects.push([path, value]); }
}
