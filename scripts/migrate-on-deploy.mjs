/**
 * Datenbank-Migration als Teil des Vercel-Builds — vor `nest build`.
 *
 * Warum hier und nicht von Hand: Neuer Code, der eine Spalte liest, die es
 * noch nicht gibt, lässt jede Anfrage scheitern. Von Hand hängt die richtige
 * Reihenfolge (erst migrieren, dann deployen) daran, dass jemand daran denkt.
 * Im Build ist sie erzwungen:
 *
 * - Scheitert die Migration, scheitert der Build. Vercel befördert dann
 *   nichts, und die bisherige Version bleibt live. Es kann also nie Code ohne
 *   seine Migration online gehen — der Fehlerfall ist "nicht deployt", nicht
 *   "kaputt deployt".
 * - Läuft die Migration und erst danach scheitert `nest build`, ist das
 *   harmlos: Migrationen hier fügen nur hinzu, und der alte Code liest die
 *   neuen Spalten schlicht nicht.
 *
 * Nur in Produktion. Previews und lokale Builds überspringen den Schritt —
 * eine Vorschau soll nicht nebenbei die Datenbank umbauen, auf die sie
 * zufällig zeigt.
 */
import { execSync } from 'node:child_process';

const env = process.env.VERCEL_ENV;

if (env !== 'production') {
  console.log(`[migrate] VERCEL_ENV=${env ?? 'nicht gesetzt'} — Migration übersprungen.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  // Lieber laut abbrechen als still ohne Migration bauen. Der Wert selbst
  // wird nie ausgegeben.
  console.error(
    '[migrate] DATABASE_URL ist im Build nicht verfügbar. Abbruch, damit kein Code ohne seine Migration live geht.',
  );
  process.exit(1);
}

console.log('[migrate] Produktion: wende ausstehende Migrationen an …');
// execSync wirft bei einem Exit-Code ungleich 0 — und damit bricht der Build ab.
execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
console.log('[migrate] Fertig.');
