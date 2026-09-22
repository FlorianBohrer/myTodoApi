export class NextOccurrenceDto {
  constructor(
    public readonly id: string,
    /** YYYY-MM-DD */
    public readonly scheduledDate: string | null,
  ) {}
}

export class TodoItemResponseDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly completed: boolean,
    public readonly isFavorite: boolean,
    // categoryId = "primäres" Label (Farb-Fallback); categoryIds = alle Labels.
    public readonly categoryId: string | null,
    public readonly categoryIds: string[],
    public readonly createdAt: Date,
    public readonly timerStartedAt: Date | null,
    public readonly timerDurationSeconds: number | null,
    // Wochenansicht: YYYY-MM-DD oder null (ungeplant).
    public readonly scheduledDate: string | null,
    // Archiviert: aus der Liste heraus, aber nicht geloescht. null = sichtbar.
    public readonly archivedAt: Date | null,
    // Wiederholung: alle drei zusammen oder keins.
    public readonly repeatEvery: number | null,
    public readonly repeatUnit: string | null,
    public readonly repeatFrom: string | null,
    // Der Plan, aus dem dieses Todo stammt. null = eigenstaendig.
    public readonly planId: string | null,
    /**
     * Die naechste Ausgabe, falls beim Abhaken eine entstanden ist.
     *
     * Steht ausdruecklich hier, damit der Client es nicht aus dem
     * geaenderten Todo ableiten muss.
     *
     * Ohne Vorgabewert, also beim Lesen einer Liste gar nicht erst im JSON.
     * Mit `= null` traege jede der 204 Zeilen ein Feld mit, das dort nie
     * etwas zu melden hat. Gesetzt wird es nur dort, wo wirklich etwas
     * entstanden sein kann: beim PUT.
     */
    public readonly nextOccurrence?: NextOccurrenceDto | null,
  ) {}
}
