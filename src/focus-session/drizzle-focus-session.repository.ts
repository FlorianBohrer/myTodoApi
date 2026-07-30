import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { focusSessions } from '../drizzle/schema';
import type { FocusSession } from '../drizzle/schema';

import {
  FocusSessionPatch,
  FocusSessionRepository,
  TodoFocusTotal,
} from './focus-session-repository';

@Injectable()
export class DrizzleFocusSessionRepository implements FocusSessionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findActive(userId: string): Promise<FocusSession | null> {
    const [session] = await this.db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          isNull(focusSessions.endedAt),
        ),
      )
      .orderBy(desc(focusSessions.startedAt))
      .limit(1);

    return session ?? null;
  }

  async findById(userId: string, id: string): Promise<FocusSession | null> {
    const [session] = await this.db
      .select()
      .from(focusSessions)
      .where(
        and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)),
      );

    return session ?? null;
  }

  async findRecent(userId: string, limit: number): Promise<FocusSession[]> {
    return this.db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.startedAt))
      .limit(limit);
  }

  async findEndedSince(userId: string, since: Date): Promise<FocusSession[]> {
    return this.db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          isNotNull(focusSessions.endedAt),
          gte(focusSessions.endedAt, since),
        ),
      )
      .orderBy(desc(focusSessions.endedAt));
  }

  async create(
    userId: string,
    todoId: string,
    todoTitle: string,
    plannedSeconds: number,
    startedAt: Date,
  ): Promise<FocusSession> {
    const [session] = await this.db
      .insert(focusSessions)
      .values({
        userId,
        todoId,
        todoTitle,
        plannedSeconds,
        startedAt,
        runningSince: startedAt,
        elapsedSeconds: 0,
      })
      .returning();

    return session;
  }

  async update(
    userId: string,
    id: string,
    patch: FocusSessionPatch,
  ): Promise<FocusSession | null> {
    const [session] = await this.db
      .update(focusSessions)
      .set(patch)
      .where(
        and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)),
      )
      .returning();

    return session ?? null;
  }

  async totalsPerTodo(userId: string): Promise<TodoFocusTotal[]> {
    // Nur Blöcke, deren Todo noch existiert — die Summe soll zur Liste passen,
    // die der Client anzeigt. Historie gelöschter Todos steckt in findRecent.
    const rows = await this.db
      .select({
        todoId: focusSessions.todoId,
        title: sql<string>`max(${focusSessions.todoTitle})`,
        totalSeconds: sql<number>`coalesce(sum(${focusSessions.elapsedSeconds}), 0)::int`,
        sessionCount: sql<number>`count(*)::int`,
      })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          isNotNull(focusSessions.todoId),
          isNotNull(focusSessions.endedAt),
        ),
      )
      .groupBy(focusSessions.todoId);

    return rows.map((row) => ({
      todoId: row.todoId as string,
      title: row.title,
      totalSeconds: row.totalSeconds,
      sessionCount: row.sessionCount,
    }));
  }
}
