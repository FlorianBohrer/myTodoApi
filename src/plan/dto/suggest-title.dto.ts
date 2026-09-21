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
