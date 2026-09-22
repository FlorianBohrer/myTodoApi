/**
 * Wann die nächste Ausgabe einer wiederkehrenden Aufgabe fällig ist.
 *
 * Eigenes Modul und reine Funktionen, weil hier die Fehler sitzen, die man
 * erst Wochen später bemerkt: ein um einen Tag verschobener Monatswechsel, ein
 * 31. Januar, der zum 3. März wird, eine Aufgabe, die nach dem Abhaken in der
 * Vergangenheit wieder auftaucht. Ohne Datenbank und ohne Nest prüfbar.
 */

export type RepeatUnit = 'day' | 'week' | 'month';

/**
 * Woran die nächste Fälligkeit hängt.
 *
 * 'due'        — am Plan: „jeden Montag". Der Rhythmus steht fest, egal wann
 *                man es tatsächlich erledigt hat.
 * 'completion' — an der Erledigung: „drei Tage nachdem ich es zuletzt gemacht
 *                habe". Für Hausarbeit fast immer das Richtige; den Müll
 *                bringt man nicht nach Kalender runter, sondern wenn er voll
 *                ist.
 */
export type RepeatFrom = 'due' | 'completion';

export const REPEAT_UNITS: RepeatUnit[] = ['day', 'week', 'month'];
export const REPEAT_FROM: RepeatFrom[] = ['due', 'completion'];

export interface RepeatRule {
  every: number;
  unit: RepeatUnit;
  from: RepeatFrom;
}

/** Die drei Spalten gehören zusammen. Fehlt eine, gibt es keine Regel. */
export function parseRepeat(row: {
  repeatEvery: number | null;
  repeatUnit: string | null;
  repeatFrom: string | null;
}): RepeatRule | null {
  const { repeatEvery: every, repeatUnit: unit, repeatFrom: from } = row;

  if (every === null || !Number.isInteger(every) || every < 1) return null;
  if (unit === null || !REPEAT_UNITS.includes(unit as RepeatUnit)) return null;
  if (from === null || !REPEAT_FROM.includes(from as RepeatFrom)) return null;

  return { every, unit: unit as RepeatUnit, from: from as RepeatFrom };
}

function toParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function format(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Wie viele Tage der Monat hat — inklusive Schaltjahr. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Datum um n Einheiten weiterschieben.
 *
 * Monate rechnen über Jahr und Monat, nicht über Tage: „ein Monat" ist keine
 * feste Zahl von Tagen. Der Tag wird dabei auf den letzten des Zielmonats
 * begrenzt, damit aus dem 31. Januar der 28. Februar wird und nicht der
 * 3. März. Tage und Wochen rechnen über UTC-Millisekunden, weil dort keine
 * Sommerzeit dazwischenfunkt.
 */
export function addInterval(
  iso: string,
  every: number,
  unit: RepeatUnit,
): string {
  const [year, month, day] = toParts(iso);

  if (unit === 'month') {
    const total = (year * 12 + (month - 1)) + every;
    const nextYear = Math.floor(total / 12);
    const nextMonth = (total % 12) + 1;
    return format(nextYear, nextMonth, Math.min(day, daysInMonth(nextYear, nextMonth)));
  }

  const days = unit === 'week' ? every * 7 : every;
  const stamp = Date.UTC(year, month - 1, day) + days * 86_400_000;
  const next = new Date(stamp);
  return format(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/**
 * Der Termin der nächsten Ausgabe. null, wenn es keine gibt.
 *
 * Bei 'due' wird so lange weitergeschoben, bis der Termin in der Zukunft
 * liegt. Hakt man eine wöchentliche Aufgabe drei Wochen zu spät ab, will man
 * den nächsten kommenden Montag und nicht einen, der zwei Wochen zurückliegt —
 * sonst steht die neue Ausgabe sofort wieder als überfällig da. Der Rhythmus
 * bleibt dabei erhalten, es fallen nur die verpassten Termine aus.
 *
 * Ohne Termin gibt es nichts zum Weiterschieben; dann zählt ab heute, egal was
 * eingestellt ist.
 */
export function nextOccurrence(
  rule: RepeatRule,
  scheduledDate: string | null,
  today: string,
): string {
  if (rule.from === 'completion' || scheduledDate === null) {
    return addInterval(today, rule.every, rule.unit);
  }

  let next = addInterval(scheduledDate, rule.every, rule.unit);

  // Obergrenze gegen eine Endlosschleife bei absurden Daten (etwa einem
  // Termin aus dem Jahr 1900). Danach steht der Termin eben in der
  // Vergangenheit, aber der Server antwortet.
  for (let i = 0; next <= today && i < 1000; i++) {
    next = addInterval(next, rule.every, rule.unit);
  }

  return next;
}

/** Heute als YYYY-MM-DD in UTC — dasselbe Format wie scheduled_date. */
export function todayISO(now: Date = new Date()): string {
  return format(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
}
