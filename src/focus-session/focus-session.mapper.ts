import type { FocusSession } from '../drizzle/schema';
import { FocusSessionResponseDto } from './dto/focus-session-response.dto';

/**
 * Reine Laufzeit: die bereits verbuchten Abschnitte plus der Abschnitt, der
 * gerade läuft. Pausen zählen nicht mit.
 */
export function computeElapsedSeconds(
  session: FocusSession,
  now: Date,
): number {
  const currentSegment = session.runningSince
    ? Math.floor((now.getTime() - session.runningSince.getTime()) / 1000)
    : 0;

  return session.elapsedSeconds + Math.max(0, currentSegment);
}

export function toFocusSessionResponse(
  session: FocusSession,
  now: Date,
): FocusSessionResponseDto {
  const elapsed = computeElapsedSeconds(session, now);
  const isEnded = session.endedAt !== null;

  return new FocusSessionResponseDto(
    session.id,
    session.todoId,
    session.todoTitle,
    session.plannedSeconds,
    session.startedAt,
    session.endedAt,
    session.completed,
    Math.min(elapsed, session.plannedSeconds),
    Math.max(0, session.plannedSeconds - elapsed),
    !isEnded && session.runningSince !== null,
    !isEnded && session.runningSince === null,
    now,
  );
}
