import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Ein Absatz, für den eine Überschrift gesucht wird. Die Obergrenze hält die
 * Anfrage klein — für eine Überschrift braucht es nicht mehr als den Anfang.
 */
export class SuggestTitleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;
}

export class SuggestTitleResponseDto {
  /** null = kein brauchbarer Vorschlag. Kein Fehler, nur nichts zu sagen. */
  title: string | null;

  constructor(title: string | null) {
    this.title = title;
  }
}

/**
 * Warum die Funktion aus ist — nicht nur DASS sie aus ist.
 *
 * Ohne diesen Grund sieht jeder Ausfall gleich aus: die Funktion erscheint
 * schlicht nicht. Beim Einrichten ist das die Hölle, weil „kein Schlüssel",
 * „Tabelle fehlt" und „läuft, aber der Absatz ist zu kurz" ununterscheidbar
 * werden. Der Client zeigt den Grund an, statt still zu schweigen.
 */
export type AiStatusReason =
  /** Alles bereit. */
  | 'ok'
  /** Kein ANTHROPIC_API_KEY in der Umgebung dieser Function. */
  | 'no-key'
  /** Das Tageskontingent liess sich nicht lesen — meist die fehlende Tabelle. */
  | 'storage';

export interface AiStatusDto {
  available: boolean;
  remaining: number;
  limit: number;
  reason: AiStatusReason;
}
