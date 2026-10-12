/**
 * Hilfsfunktionen für scripts/migrate-on-deploy.mjs: den Stand der
 * Datenbank lesen und Fehler so ausgeben, dass man sie lesen kann.
 *
 * Eigene Datei, damit sie sich gegen ein echtes Postgres prüfen lassen, ohne
 * dass dafür eine Neon-Verbindung nötig ist.
 */

/**
 * Welche Migrationen die Datenbank als eingespielt führt — und welche
 * deshalb noch ausstehen.
 *
 * Dieselbe Regel wie im Migrator von drizzle-orm: maßgeblich ist der
 * jüngste Eintrag in drizzle.__drizzle_migrations (`created_at` = das
 * `when` aus dem Journal). Alles, was im Journal danach kommt, steht aus.
 *
 * @param {(sql: string) => Promise<any[]>} query
 * @param {{ entries: { tag: string, when: number }[] }} journal
 */
export async function migrationState(query, journal) {
  const entries = journal.entries;
  const [{ present }] = await query(
    `select to_regclass('drizzle.__drizzle_migrations') is not null as present`,
  );

  let recorded = 0;
  let last = null;
  if (present) {
    const [row] = await query(
      `select count(*)::int as recorded, max(created_at)::text as last from drizzle.__drizzle_migrations`,
    );
    recorded = row.recorded;
    last = row.last === null ? null : Number(row.last);
  }

  const lastTag = last === null ? null : entries.find((e) => e.when === last)?.tag ?? `unbekannt (${last})`;
  const pending = entries.filter((e) => last === null || e.when > last).map((e) => e.tag);

  return { tablePresent: !!present, inRepo: entries.length, recorded, lastTag, pending };
}

/** Eine Zeile für das Build-Log. */
export function formatState(state) {
  const table = state.tablePresent
    ? `${state.recorded} als eingespielt verbucht, zuletzt ${state.lastTag ?? '–'}`
    : 'Verzeichnis drizzle.__drizzle_migrations fehlt';
  return `Migrationen im Repo: ${state.inRepo}; Datenbank: ${table}; ausstehend: ${
    state.pending.length === 0 ? 'keine' : state.pending.join(', ')
  }`;
}

/**
 * Einen Fehler lesbar machen — ohne Zugangsdaten.
 *
 * Postgres-Fehler tragen code/detail/hint; der Neon-Treiber reicht bei
 * Verbindungsproblemen auch Ereignis-Objekte weiter, die keine `message`
 * haben, sondern ein `error` darin. Alles wird eingesammelt, und jedes
 * Vorkommen der Geheimnisse (ganze URL, Passwort) wird geschwärzt.
 *
 * @param {unknown} err
 * @param {string[]} secrets
 */
export function describeError(err, secrets = []) {
  const e = /** @type {any} */ (err) ?? {};
  const raw =
    e.message || e.error?.message || (e.type ? `Ereignis „${e.type}" ohne Meldung` : String(err));
  // drizzle-orm legt die ganze SQL-Anweisung mehrzeilig in die Meldung
  // („Failed query: CREATE TABLE … params:"). Fürs Log reicht die erste Zeile;
  // die eigentliche Ursache steht in `cause` und kommt unten dazu.
  const [firstLine, ...rest] = String(raw).split('\n');
  const message = rest.some((line) => line.trim()) ? `${firstLine.trim()} …` : firstLine.trim();

  const parts = [message];
  if (e.code) parts.push(`Code ${e.code}`);
  if (e.detail) parts.push(`Detail: ${e.detail}`);
  if (e.hint) parts.push(`Hinweis von Postgres: ${e.hint}`);
  if (e.table) parts.push(`Tabelle ${e.table}`);
  if (e.column) parts.push(`Spalte ${e.column}`);
  if (e.cause?.message && e.cause.message !== message) parts.push(`Ursache: ${e.cause.message}`);

  let text = parts.join(' · ');
  for (const secret of secrets) {
    if (secret && secret.length >= 4) text = text.split(secret).join('***');
  }

  return { text, code: e.code ?? e.cause?.code ?? e.error?.code ?? null };
}

/** Was ein Fehlercode in dieser Lage bedeutet. null, wenn nichts Bestimmtes. */
export function hintFor(code) {
  switch (code) {
    case '42P07': // duplicate_table
    case '42701': // duplicate_column
    case '42710': // duplicate_object
    case '42P06': // duplicate_schema
      return (
        'Die Datenbank enthält schon, was die ausstehende Migration anlegen will, ' +
        'führt sie aber nicht als eingespielt. Typisch, wenn früher mit `db:push` ' +
        'statt `db:migrate` gearbeitet wurde. Nichts wurde verändert (eine Transaktion).'
      );
    case '28P01':
      return 'Anmeldung abgelehnt. DATABASE_URL in den Vercel-Einstellungen prüfen.';
    case '3D000':
      return 'Die Datenbank aus DATABASE_URL gibt es nicht.';
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ETIMEDOUT':
      return 'Keine Verbindung zur Datenbank aus dem Build heraus.';
    default:
      return null;
  }
}
