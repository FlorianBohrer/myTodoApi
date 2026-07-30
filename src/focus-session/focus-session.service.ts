// src/focus-session/focus-session.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { FocusSession } from '../drizzle/schema';
import { TODO_REPOSITORY } from '../todo/todo-repository';
import type { TodoRepository } from '../todo/todo-repository';

import { FOCUS_SESSION_REPOSITORY } from './focus-session-repository';
import type {
  FocusSessionRepository,
  TodoFocusTotal,
} from './focus-session-repository';
import { computeElapsedSeconds } from './focus-session.mapper';
import {
  DayFocusTotalDto,
  FocusStatsResponseDto,
  TodoFocusTotalDto,
} from './dto/focus-stats-response.dto';

@Injectable()
export class FocusSessionService {
  constructor(
    @Inject(FOCUS_SESSION_REPOSITORY)
    private readonly repository: FocusSessionRepository,
    @Inject(TODO_REPOSITORY)
    private readonly todos: TodoRepository,
  ) {}

  /**
   * Der offene Block, falls es einen gibt.
   *
   * Läuft dabei die Zeit ab, während niemand zusieht (Deckel zu, App beendet),
   * wird der Block hier nachträglich sauber geschlossen. Der Aufrufer bekommt
   * ihn genau einmal mit gesetztem endedAt zurück und kann daraufhin melden,
   * dass der Block fertig ist.
   */
  async findActive(userId: string): Promise<FocusSession | null> {
    const session = await this.repository.findActive(userId);
    if (!session) return null;

    const now = new Date();
    const elapsed = computeElapsedSeconds(session, now);

    if (session.runningSince && elapsed >= session.plannedSeconds) {
      // Ende rückdatieren auf den Zeitpunkt, an dem die Zeit tatsächlich um war.
      const remainingAtResume =
        session.plannedSeconds - session.elapsedSeconds;
      const endedAt = new Date(
        session.runningSince.getTime() + remainingAtResume * 1000,
      );

      return this.finish(userId, session, {
        endedAt,
        elapsedSeconds: session.plannedSeconds,
        completed: true,
      });
    }

    return session;
  }

  async start(
    userId: string,
    todoId: string,
    plannedSeconds: number,
  ): Promise<FocusSession> {
    const todo = await this.todos.findById(userId, todoId);
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    // Höchstens ein Block gleichzeitig — ein laufender wird als abgebrochen
    // verbucht, nicht stillschweigend überschrieben.
    const active = await this.findActive(userId);
    if (active && active.endedAt === null) {
      await this.stop(userId, active.id, false);
    }

    const startedAt = new Date();
    const session = await this.repository.create(
      userId,
      todoId,
      todo.title,
      plannedSeconds,
      startedAt,
    );

    // Bestehende Timer-Felder mitführen, damit die Weboberfläche denselben
    // laufenden Block anzeigt.
    await this.todos.setTimer(userId, todoId, startedAt, plannedSeconds);

    return session;
  }

  async pause(userId: string, id: string): Promise<FocusSession> {
    const session = await this.requireOpen(userId, id);

    if (!session.runningSince) {
      throw new BadRequestException('Block ist bereits pausiert');
    }

    const elapsed = computeElapsedSeconds(session, new Date());

    const paused = await this.repository.update(userId, id, {
      elapsedSeconds: Math.min(elapsed, session.plannedSeconds),
      runningSince: null,
    });

    if (!paused) throw new NotFoundException('Block nicht gefunden');

    await this.clearTodoTimer(userId, session.todoId);

    return paused;
  }

  async resume(userId: string, id: string): Promise<FocusSession> {
    const session = await this.requireOpen(userId, id);

    if (session.runningSince) {
      throw new BadRequestException('Block läuft bereits');
    }

    const runningSince = new Date();
    const remaining = session.plannedSeconds - session.elapsedSeconds;

    const resumed = await this.repository.update(userId, id, { runningSince });

    if (!resumed) throw new NotFoundException('Block nicht gefunden');

    // Restzeit statt Gesamtdauer: die Weboberfläche rechnet Start + Dauer,
    // nach einer Pause stimmt sonst das Ende nicht mehr.
    await this.setTodoTimer(userId, session.todoId, runningSince, remaining);

    return resumed;
  }

  async stop(
    userId: string,
    id: string,
    completed?: boolean,
  ): Promise<FocusSession> {
    const session = await this.requireOpen(userId, id);

    const now = new Date();
    const elapsed = Math.min(
      computeElapsedSeconds(session, now),
      session.plannedSeconds,
    );

    return this.finish(userId, session, {
      endedAt: now,
      elapsedSeconds: elapsed,
      // ohne Angabe entscheidet die Uhr: war die Zeit um, gilt der Block als
      // durchgelaufen.
      completed: completed ?? elapsed >= session.plannedSeconds,
    });
  }

  async findRecent(userId: string, limit: number): Promise<FocusSession[]> {
    return this.repository.findRecent(userId, limit);
  }

  /**
   * Tagessumme und Verteilung. tzOffsetMinutes ist der Offset des Clients
   * (Date#getTimezoneOffset umgekehrt), damit "heute" dort endet, wo der Nutzer
   * sitzt, und nicht in UTC.
   */
  async stats(
    userId: string,
    days: number,
    tzOffsetMinutes: number,
  ): Promise<FocusStatsResponseDto> {
    const offsetMs = tzOffsetMinutes * 60 * 1000;
    const startOfToday = this.startOfLocalDay(new Date(), offsetMs);
    const from = new Date(startOfToday.getTime() - (days - 1) * 86400000);

    const [sessions, perTodo] = await Promise.all([
      this.repository.findEndedSince(userId, from),
      this.repository.totalsPerTodo(userId),
    ]);

    const buckets = new Map<string, { seconds: number; count: number }>();

    // Leere Tage vorbelegen, sonst fehlen sie in der Ausgabe.
    for (let i = 0; i < days; i += 1) {
      const day = new Date(from.getTime() + i * 86400000);
      buckets.set(this.localDateKey(day, offsetMs), { seconds: 0, count: 0 });
    }

    for (const session of sessions) {
      if (!session.endedAt) continue;

      const key = this.localDateKey(session.endedAt, offsetMs);
      const bucket = buckets.get(key);
      if (!bucket) continue;

      bucket.seconds += session.elapsedSeconds;
      bucket.count += 1;
    }

    const todayKey = this.localDateKey(new Date(), offsetMs);
    const today = buckets.get(todayKey) ?? { seconds: 0, count: 0 };

    const perDay = [...buckets.entries()].map(
      ([date, bucket]) =>
        new DayFocusTotalDto(date, bucket.seconds, bucket.count),
    );

    return new FocusStatsResponseDto(
      today.seconds,
      today.count,
      perDay,
      perTodo.map(this.toTodoTotalDto),
    );
  }

  private toTodoTotalDto(total: TodoFocusTotal): TodoFocusTotalDto {
    return new TodoFocusTotalDto(
      total.todoId,
      total.title,
      total.totalSeconds,
      total.sessionCount,
    );
  }

  private async requireOpen(
    userId: string,
    id: string,
  ): Promise<FocusSession> {
    const session = await this.repository.findById(userId, id);

    if (!session) {
      throw new NotFoundException('Block nicht gefunden');
    }

    if (session.endedAt) {
      throw new BadRequestException('Block ist bereits beendet');
    }

    return session;
  }

  private async finish(
    userId: string,
    session: FocusSession,
    patch: { endedAt: Date; elapsedSeconds: number; completed: boolean },
  ): Promise<FocusSession> {
    const finished = await this.repository.update(userId, session.id, {
      ...patch,
      runningSince: null,
    });

    if (!finished) throw new NotFoundException('Block nicht gefunden');

    await this.clearTodoTimer(userId, session.todoId);

    return finished;
  }

  private async clearTodoTimer(
    userId: string,
    todoId: string | null,
  ): Promise<void> {
    await this.setTodoTimer(userId, todoId, null, null);
  }

  private async setTodoTimer(
    userId: string,
    todoId: string | null,
    startedAt: Date | null,
    durationSeconds: number | null,
  ): Promise<void> {
    // todoId ist null, wenn das Todo inzwischen gelöscht wurde — dann gibt es
    // nichts mehr zu synchronisieren.
    if (!todoId) return;

    await this.todos.setTimer(userId, todoId, startedAt, durationSeconds);
  }

  /** Mitternacht des lokalen Tages, ausgedrückt als UTC-Zeitpunkt. */
  private startOfLocalDay(date: Date, offsetMs: number): Date {
    const local = new Date(date.getTime() + offsetMs);
    local.setUTCHours(0, 0, 0, 0);

    return new Date(local.getTime() - offsetMs);
  }

  private localDateKey(date: Date, offsetMs: number): string {
    return new Date(date.getTime() + offsetMs).toISOString().slice(0, 10);
  }
}
