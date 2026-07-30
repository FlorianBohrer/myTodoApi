import type { FocusSession } from '../drizzle/schema';

export const FOCUS_SESSION_REPOSITORY = Symbol('FOCUS_SESSION_REPOSITORY');

/** Aufsummierte Fokuszeit je Todo, für die Liste im Menüleisten-Client. */
export interface TodoFocusTotal {
  todoId: string;
  title: string;
  totalSeconds: number;
  sessionCount: number;
}

export interface FocusSessionPatch {
  elapsedSeconds?: number;
  runningSince?: Date | null;
  endedAt?: Date | null;
  completed?: boolean;
}

export interface FocusSessionRepository {
  /** Der eine offene Block eines Nutzers (endedAt ist null), sonst null. */
  findActive(userId: string): Promise<FocusSession | null>;

  findById(userId: string, id: string): Promise<FocusSession | null>;

  findRecent(userId: string, limit: number): Promise<FocusSession[]>;

  /** Beendete Blöcke ab einem Zeitpunkt, für Tages- und Wochensummen. */
  findEndedSince(userId: string, since: Date): Promise<FocusSession[]>;

  create(
    userId: string,
    todoId: string,
    todoTitle: string,
    plannedSeconds: number,
    startedAt: Date,
  ): Promise<FocusSession>;

  update(
    userId: string,
    id: string,
    patch: FocusSessionPatch,
  ): Promise<FocusSession | null>;

  totalsPerTodo(userId: string): Promise<TodoFocusTotal[]>;
}
