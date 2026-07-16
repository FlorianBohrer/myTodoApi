import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import type { Todo } from '../drizzle/schema';

import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoRepository } from './todo-repository';
import {
  categories,
  todos,
} from '../drizzle/schema';

@Injectable()
export class DrizzleTodoRepository implements TodoRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findAll(userId: string): Promise<Todo[]> {
    return this.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(asc(todos.position), asc(todos.createdAt));
  }

  async findById(userId: string, id: string): Promise<Todo | null> {
    const [todo] = await this.db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.userId, userId),
        ),
      );

    return todo ?? null;
  }

  async create(
    userId: string,
    dto: CreateTodoDto,
  ): Promise<Todo> {
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

  async update(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<Todo | null> {
    const [todo] = await this.db
      .update(todos)
      .set(dto)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.userId, userId),
        ),
      )
      .returning();

    return todo ?? null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [deletedTodo] = await this.db
      .delete(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.userId, userId),
        ),
      )
      .returning();

    return deletedTodo !== undefined;
  }

  async categoryBelongsToUser(
  userId: string,
  categoryId: string,
): Promise<boolean> {
  const [category] = await this.db
    .select({
      id: categories.id,
    })
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId),
      ),
    )
    .limit(1);

  return category !== undefined;
}

  async reorder(userId: string, ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) =>
        this.db
          .update(todos)
          .set({ position: index })
          .where(
            and(
              eq(todos.id, id),
              eq(todos.userId, userId),
            ),
          ),
      ),
    );
  }
}