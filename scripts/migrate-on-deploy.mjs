/**
 * Datenbank-Migration als Teil des Vercel-Builds — vor `nest build`.
 *
 * Warum hier und nicht von Hand: Neuer Code, der eine Spalte liest, die es
 * noch nicht gibt, lässt jede Anfrage scheitern. Von Hand hängt die richtige
 * Reihenfolge (erst migrieren, dann deployen) daran, dass jemand daran denkt.
 * Im Build ist sie erzwungen:
 *
 * - Scheitert die Migration, scheitert der Build. Vercel befördert dann
 *   nichts, und die bisherige Version bleibt live. Der Fehlerfall ist "nicht
 *   deployt", nie "ohne Migration deployt".
 * - Läuft die Migration und erst danach scheitert `nest build`, ist das
 *   harmlos: Migrationen hier fügen nur hinzu, und der alte Code liest die
 *   neuen Spalten schlicht nicht.
 *
 * Nur in Produktion. Previews und lokale Builds überspringen den Schritt —
 * eine Vorschau soll nicht nebenbei die Datenbank umbauen, auf die sie
 * zufällig zeigt.
 *
 * Warum nicht `drizzle-kit migrate`: Das lief hier zweimal mit Exit-Code 1
 * und OHNE jede Meldung ab — der Fortschritts-Kreisel von drizzle-kit
 * überschreibt die Zeile, in der der Fehler stünde. Ein Gate, das nicht sagen
 * kann, warum es zu ist, hilft niemandem. Hier wird deshalb derselbe Migrator
 * aufgerufen, den drizzle-kit intern benutzt (drizzle-orm, neon-serverless),
 * mit derselben Verbindung wie zur Laufzeit (src/drizzle/drizzle.module.ts),
 * und jeder Fehler wird ausgeschrieben.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';

import { describeError, formatState, hintFor, migrationState } from './migrate-report.mjs';

const env = process.env.VERCEL_ENV;

if (env !== 'production') {
  console.log(`[migrate] VERCEL_ENV=${env ?? 'nicht gesetzt'} — Migration übersprungen.`);
  process.exit(0);
}

const url = process.env.DATABASE_URL;

if (!url) {
  // Lieber laut abbrechen als still ohne Migration bauen.
  console.error(
    '[migrate] DATABASE_URL ist im Build nicht verfügbar. Abbruch, damit kein Code ohne seine Migration live geht.',
  );
  process.exit(1);
}

// Ein hängender Build ist schlechter als ein abgebrochener: nach zwei Minuten
// ist Schluss, mit Meldung.
setTimeout(() => {
  console.error('[migrate] Keine Antwort nach 120 s. Abbruch, die bisherige Version bleibt live.');
  process.exit(1);
}, 120_000).unref();

/** Was in keinem Log auftauchen darf: die ganze URL und das Passwort darin. */
function secretsOf(connectionString) {
  const secrets = [connectionString];
  try {
    const password = decodeURIComponent(new URL(connectionString).password);
    if (password) secrets.push(password, encodeURIComponent(password));
  } catch {
    /* keine parsebare URL — dann eben nur die ganze */
  }
  return secrets;
}

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));
const journal = JSON.parse(readFileSync(`${migrationsFolder}/meta/_journal.json`, 'utf8'));

// Wie zur Laufzeit: Neon über WebSocket, mit dem ws-Paket der App.
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: url, max: 1 });
const query = async (sql) => (await pool.query(sql)).rows;

let failed = false;

try {
  const before = await migrationState(query, journal);
  console.log(`[migrate] Vorher: ${formatState(before)}`);

  if (before.pending.length === 0) {
    console.log('[migrate] Nichts zu tun.');
  } else {
    // Alles Ausstehende in EINER Transaktion (so arbeitet der Migrator von
    // drizzle-orm): scheitert eine Anweisung, bleibt die Datenbank, wie sie war.
    await migrate(drizzle(pool), { migrationsFolder });

    const after = await migrationState(query, journal);
    console.log(`[migrate] Nachher: ${formatState(after)}`);
    if (after.pending.length > 0) {
      throw new Error(`Nach dem Lauf stehen noch Migrationen aus: ${after.pending.join(', ')}`);
    }
  }

  console.log('[migrate] Fertig.');
} catch (err) {
  failed = true;
  const { text, code } = describeError(err, secretsOf(url));
  console.error(`[migrate] FEHLGESCHLAGEN: ${text}`);
  const hint = hintFor(code);
  if (hint) console.error(`[migrate] ${hint}`);
  console.error('[migrate] Abbruch. Die bisherige Version bleibt live.');
} finally {
  await pool.end().catch(() => {});
}

process.exit(failed ? 1 : 0);
