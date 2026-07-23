import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import type { Todo, TodoWithCategories } from '../drizzle/schema';

import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoRepository } from './todo-repository';
import {
  categories,
  todoCategories,
  todos,
} from '../drizzle/schema';

@Injectable()
export class DrizzleTodoRepository implements TodoRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  // ---- Label-IDs (n:m) laden und an Todos hängen ----

  /** Label-IDs je Todo, sortiert nach Folder-Position (stabile "erste" Farbe). */
  private async loadCategoryIds(
    todoIds: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (todoIds.length === 0) return map;

    const rows = await this.db
      .select({
        todoId: todoCategories.todoId,
        categoryId: todoCategories.categoryId,
      })
      .from(todoCategories)
      .innerJoin(categories, eq(todoCategories.categoryId, categories.id))
      .where(inArray(todoCategories.todoId, todoIds))
      .orderBy(asc(categories.position), asc(categories.createdAt));

    for (const row of rows) {
      const list = map.get(row.todoId) ?? [];
      list.push(row.categoryId);
      map.set(row.todoId, list);
    }
    return map;
  }

  private async withCategories(todo: Todo): Promise<TodoWithCategories> {
    const map = await this.loadCategoryIds([todo.id]);
    return { ...todo, categoryIds: map.get(todo.id) ?? [] };
  }

  // ---- Lesen ----

  async findAll(userId: string): Promise<TodoWithCategories[]> {
    const rows = await this.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(asc(todos.position), asc(todos.createdAt));

    const map = await this.loadCategoryIds(rows.map((t) => t.id));
    return rows.map((t) => ({ ...t, categoryIds: map.get(t.id) ?? [] }));
  }

  async findById(
    userId: string,
    id: string,
  ): Promise<TodoWithCategories | null> {
    const [todo] = await this.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));

    return todo ? this.withCategories(todo) : null;
  }

  // ---- Schreiben ----

  async create(
    userId: string,
    dto: CreateTodoDto,
  ): Promise<TodoWithCategories> {
    const [{ maxPosition }] = await this.db
      .select({
        maxPosition: sql<number>`coalesce(max(${todos.position}), -1)`,
      })
      .from(todos)
      .where(eq(todos.userId, userId));

    const [todo] = await this.db
      .insert(todos)
      .values({
        userId,
        title: dto.title,
        categoryId: dto.categoryId ?? null,
        position: maxPosition + 1,
      })
      .returning();

    // Beim Anlegen mit aktivem Folder gleich die n:m-Zuweisung setzen.
    if (dto.categoryId) {
      await this.db
        .insert(todoCategories)
        .values({ todoId: todo.id, categoryId: dto.categoryId })
        .onConflictDoNothing();
    }

    return this.withCategories(todo);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<TodoWithCategories | null> {
    const [todo] = await this.db
      .update(todos)
      .set(dto)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    if (!todo) return null;

    // Alt-Pfad (Einzel-Kategorie via PUT /todo/:id) hält die Zwischentabelle
    // synchron — sonst driftet die n:m-Menge, sobald ein Client noch categoryId
    // direkt setzt.
    if (dto.categoryId !== undefined) {
      await this.db
        .delete(todoCategories)
        .where(eq(todoCategories.todoId, id));
      if (dto.categoryId !== null) {
        await this.db
          .insert(todoCategories)
          .values({ todoId: id, categoryId: dto.categoryId })
          .onConflictDoNothing();
      }
    }

    return this.withCategories(todo);
  }

  /** Ersetzt die komplette Label-Menge eines Todos (Zwischentabelle). */
  async setCategories(
    userId: string,
    id: string,
    categoryIds: string[],
  ): Promise<TodoWithCategories | null> {
    const [owned] = await this.db
      .select({ id: todos.id })
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .limit(1);
    if (!owned) return null;

    await this.db
      .delete(todoCategories)
      .where(eq(todoCategories.todoId, id));

    if (categoryIds.length > 0) {
      await this.db
        .insert(todoCategories)
        .values(categoryIds.map((categoryId) => ({ todoId: id, categoryId })))
        .onConflictDoNothing();
    }

    // categoryId als "primäres" Label mitpflegen — hält Alt-Clients konsistent
    // und dient als Farb-Fallback.
    const [todo] = await this.db
      .update(todos)
      .set({ categoryId: categoryIds[0] ?? null })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    return todo ? this.withCategories(todo) : null;
  }

  async setTimer(
    userId: string,
    id: string,
    startedAt: Date | null,
    durationSeconds: number | null,
  ): Promise<TodoWithCategories | null> {
    const [todo] = await this.db
      .update(todos)
      .set({
        timerStartedAt: startedAt,
        timerDurationSeconds: durationSeconds,
      })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    return todo ? this.withCategories(todo) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [deletedTodo] = await this.db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    return deletedTodo !== undefined;
  }

  async categoryBelongsToUser(
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    const [category] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    return category !== undefined;
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) =>
        this.db
          .update(todos)
          .set({ position: index })
          .where(and(eq(todos.id, id), eq(todos.userId, userId))),
      ),
    );
  }
}
