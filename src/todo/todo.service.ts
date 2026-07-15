// src/todo/todo.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { todos, Todo } from '../drizzle/schema';
import { Filter } from './todo.model';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}
  async findAll(userId: string, filter: Filter): Promise<Todo[]> {
    const items = await this.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(asc(todos.position), asc(todos.createdAt));

    if (filter === 'active') return items.filter((t) => !t.completed);
    if (filter === 'completed') return items.filter((t) => t.completed);
    return items;
  }

  async findById(userId: string, id: string): Promise<Todo> {
    const [todo] = await this.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));

    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  async createTodo(userId: string, dto: CreateTodoDto): Promise<Todo> {
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

    return todo;
  }

  /** Speichert die neue Reihenfolge: Index im Array = Position. */
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

  async updateTodo(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<Todo> {
    const [todo] = await this.db
      .update(todos)
      .set(dto)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  async deleteTodo(userId: string, id: string): Promise<void> {
    const [todo] = await this.db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    if (!todo) throw new NotFoundException('Todo not found');
  }
}