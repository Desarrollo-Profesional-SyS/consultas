// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DEL JUEGO
// ─────────────────────────────────────────────────────────────────────────────

// Pega aquí la configuración de tu proyecto de Firebase (Consola de Firebase →
// Configuración del proyecto → Tus apps → SDK de Firebase → Configuración).
// Estos datos NO son secretos: están hechos para ir en la página.
// Mientras sea null, el juego funciona en "modo ensayo local": todo corre en una
// sola computadora (varias pestañas del mismo navegador), útil para practicar.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAa6tRvNWjHvZqgA0z9aGynExBlmnthPUQ",
  authDomain: "te-acuerdas.firebaseapp.com",
  databaseURL: "https://te-acuerdas-default-rtdb.firebaseio.com",
  projectId: "te-acuerdas",
  storageBucket: "te-acuerdas.firebasestorage.app",
  messagingSenderId: "671384647523",
  appId: "1:671384647523:web:8c1ba308c5978f86b84556"
};

// Segundos que se queda cada una de las 20 palabras antes de avanzar sola.
// (El anillo de cuenta regresiva de las diapositivas está dibujado para 5.)
export const WORD_SECONDS = 5;

// Duración de cada ronda, en segundos.
export const ROUND_SECONDS = { 1: 120, 2: 180 };

// Sonidos en la presentación (se pueden apagar desde la pantalla de inicio).
export const SOUND_DEFAULT = true;
