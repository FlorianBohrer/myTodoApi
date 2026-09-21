import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { aiUsage } from '../drizzle/schema';

/** Vorschläge pro Nutzer und Tag, wenn nichts anderes konfiguriert ist. */
export const DEFAULT_DAILY_LIMIT = 100;

/**
 * Das Limit aus der Umgebung lesen.
 *
 * Getrennt und ohne Nest-Abhängigkeiten, weil genau hier etwas schiefgehen
 * kann: ein leerer, vergessener oder vertippter Wert darf den Deckel nicht
 * still abschalten. Number('') ist 0, Number('abc') ist NaN — beides führte
 * ungeprüft zu einem Limit von 0 oder zu NaN-Vergleichen, die immer falsch
 * sind. Also: nur eine positive ganze Zahl zählt, alles andere fällt zurück.
 */
export function resolveDailyLimit(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw.trim() === '') {
    return DEFAULT_DAILY_LIMIT;
  }
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_DAILY_LIMIT;
}

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Tageskontingent für die Titelvorschläge.
 *
 * Jeder Aufruf kostet Geld, und der Endpunkt steht jedem angemeldeten Nutzer
 * offen. Ohne Deckel kann eine Schleife im Client — oder jemand mit einem
 * Konto und Langeweile — die Rechnung beliebig hoch treiben.
 *
 * Gezählt wird in Postgres, weil das Backend als Serverless Functions läuft:
 * ein Zähler im Arbeitsspeicher würde bei jeder kalten Instanz von vorn
 * beginnen und wäre damit kein Deckel, sondern Dekoration.
 */
@Injectable()
export class AiQuotaService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly config: ConfigService,
  ) {}

  get limit(): number {
    return resolveDailyLimit(this.config.get<string>('AI_DAILY_LIMIT'));
  }

  /**
   * Einen Vorschlag abbuchen. false = Kontingent für heute aufgebraucht.
   *
   * Prüfen und Hochzählen passieren in EINEM Statement. Getrennt wäre zwischen
   * beiden Platz für eine zweite Anfrage, und zwei gleichzeitige Aufrufe am
   * Limit kämen beide durch.
   */
  async consume(userId: string): Promise<boolean> {
    const limit = this.limit;

    const rows = await this.db
      .insert(aiUsage)
      .values({ userId, day: sql`CURRENT_DATE`, count: 1 })
      .onConflictDoUpdate({
        target: [aiUsage.userId, aiUsage.day],
        set: { count: sql`${aiUsage.count} + 1` },
        // Greift die Bedingung nicht, wird nichts geschrieben und nichts
        // zurückgegeben — genau das ist der abgelehnte Fall.
        setWhere: sql`${aiUsage.count} < ${limit}`,
      })
      .returning({ count: aiUsage.count });

    return rows.length > 0;
  }

  /** Stand für heute, ohne etwas abzubuchen. */
  async state(userId: string): Promise<QuotaState> {
    const limit = this.limit;

    const [row] = await this.db
      .select({ count: aiUsage.count })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, sql`CURRENT_DATE`)));

    const used = row?.count ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used) };
  }
}
