// Estado compartido en Firebase Realtime Database, con inicio de sesión anónimo
// (cada celular recibe una identidad propia que sobrevive si recarga la página).
import {
  initializeApp, getAuth, signInAnonymously, onAuthStateChanged,
  getDatabase, ref, onValue, set, update, remove, get, onDisconnect,
} from '../vendor/firebase.js';

export class FirebaseStore {
  mode = 'firebase';

  constructor(config) {
    this.config = config;
    this.offset = 0;
  }

  async init() {
    this.app = initializeApp(this.config);
    this.auth = getAuth(this.app);
    this.db = getDatabase(this.app);
    const user = await new Promise((resolve, reject) => {
      const stop = onAuthStateChanged(this.auth, (u) => {
        if (u) { stop(); resolve(u); }
      }, reject);
      signInAnonymously(this.auth).catch(reject);
    });
    this.uid = user.uid;
    onValue(ref(this.db, '.info/serverTimeOffset'), (s) => { this.offset = s.val() || 0; });
  }

  on(path, cb) {
    return onValue(ref(this.db, path), (snap) => cb(snap.val()), (err) => console.warn('[firebase]', path, err.message));
  }

  async get(path) { return (await get(ref(this.db, path))).val(); }
  set(path, value) { return set(ref(this.db, path), value); }
  update(path, patch) { return update(ref(this.db, path), patch); }
  remove(path) { return remove(ref(this.db, path)); }
  now() { return Date.now() + this.offset; }

  onConnection(cb) {
    return onValue(ref(this.db, '.info/connected'), (s) => cb(s.val() === true));
  }

  onDisconnectSet(path, value) {
    return onDisconnect(ref(this.db, path)).set(value);
  }
}
