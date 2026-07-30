export class FocusSessionResponseDto {
  constructor(
    public readonly id: string,
    public readonly todoId: string | null,
    public readonly todoTitle: string,
    public readonly plannedSeconds: number,
    public readonly startedAt: Date,
    public readonly endedAt: Date | null,
    public readonly completed: boolean,
    /** Reine Laufzeit inklusive des gerade laufenden Abschnitts. */
    public readonly elapsedSeconds: number,
    /** plannedSeconds minus elapsedSeconds, nie negativ. */
    public readonly remainingSeconds: number,
    public readonly isRunning: boolean,
    public readonly isPaused: boolean,
    /**
     * Serverzeit zum Zeitpunkt der Antwort. Der Client rechnet damit seine
     * eigene Uhr gegen — sonst zeigt eine schiefe Systemuhr eine falsche Restzeit.
     */
    public readonly serverTime: Date,
  ) {}
}

export class ActiveFocusSessionResponseDto {
  constructor(
    public readonly session: FocusSessionResponseDto | null,
    public readonly serverTime: Date,
  ) {}
}
