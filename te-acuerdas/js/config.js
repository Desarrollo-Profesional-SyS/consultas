// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DEL JUEGO
// ─────────────────────────────────────────────────────────────────────────────

// Pega aquí la configuración de tu proyecto de Firebase (Consola de Firebase →
// Configuración del proyecto → Tus apps → SDK de Firebase → Configuración).
// Estos datos NO son secretos: están hechos para ir en la página.
// Mientras sea null, el juego funciona en "modo ensayo local": todo corre en una
// sola computadora (varias pestañas del mismo navegador), útil para practicar.
export const FIREBASE_CONFIG = null;

// Duración de cada ronda, en segundos.
export const ROUND_SECONDS = { 1: 120, 2: 180 };

// Sonidos en la presentación (se pueden apagar desde la pantalla de inicio).
export const SOUND_DEFAULT = true;
