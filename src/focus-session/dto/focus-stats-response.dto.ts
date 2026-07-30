export class TodoFocusTotalDto {
  constructor(
    public readonly todoId: string,
    public readonly title: string,
    public readonly totalSeconds: number,
    public readonly sessionCount: number,
  ) {}
}

export class DayFocusTotalDto {
  constructor(
    /** YYYY-MM-DD in der Zeitzone, die der Client mitgeschickt hat. */
    public readonly date: string,
    public readonly totalSeconds: number,
    public readonly sessionCount: number,
  ) {}
}

export class FocusStatsResponseDto {
  constructor(
    public readonly todaySeconds: number,
    public readonly todaySessions: number,
    public readonly perDay: DayFocusTotalDto[],
    public readonly perTodo: TodoFocusTotalDto[],
  ) {}
}
