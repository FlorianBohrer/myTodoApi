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

/** Was der Dienst zurueckgibt: ein Titel, oder keiner samt Grund. */
export interface SuggestionResult {
  title: string | null;
  /** Gesetzt, wenn der Aufruf scheiterte. Fehlt, wenn schlicht nichts zu sagen war. */
  error?: string;
}

export class SuggestTitleResponseDto {
  /** null = kein Titel. Ohne `error` heisst das: nichts zu sagen, kein Problem. */
  title: string | null;
  error?: string;

  constructor(result: SuggestionResult) {
    this.title = result.title;
    this.error = result.error;
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
