
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { TodoWithCategories } from '../drizzle/schema';
import type { Filter } from './todo.model';
import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';

import {
  TODO_REPOSITORY,
  type TodoRepository,
} from '../../src/todo/todo-repository';


@Injectable()
export class TodoService {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly repository: TodoRepository,
  ) {}

  async findAll(userId: string, filter: Filter): Promise<TodoWithCategories[]> {
    const items = await this.repository.findAll(userId);

    if (filter === 'active') {
      return items.filter((todo) => !todo.completed);
    }

    if (filter === 'completed') {
      return items.filter((todo) => todo.completed);
    }

    return items;
  }

  async findById(userId: string, id: string): Promise<TodoWithCategories> {
    const todo = await this.repository.findById(userId, id);

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

async createTodo(
  userId: string,
  dto: CreateTodoDto,
): Promise<TodoWithCategories> {
  await this.assertCategoryOwnership(
    userId,
    dto.categoryId,
  );

  return this.repository.create(userId, dto);
}

  async reorder(userId: string, ids: string[]): Promise<void> {
    return this.repository.reorder(userId, ids);
  }

 async updateTodo(
  userId: string,
  id: string,
  dto: UpdateTodoDto,
): Promise<TodoWithCategories> {
  await this.assertCategoryOwnership(
    userId,
    dto.categoryId,
  );

  const todo = await this.repository.update(
    userId,
    id,
    dto,
  );

  if (!todo) {
    throw new NotFoundException('Todo not found');
  }

  return todo;
}

  /**
   * Startet einen Zeitblock (durationSeconds gesetzt) oder beendet ihn (null).
   * Der Startzeitpunkt kommt vom Server, damit die Restzeit unabhängig von der
   * Uhr des Browsers stimmt.
   */
  async setTimer(
    userId: string,
    id: string,
    durationSeconds: number | null,
  ): Promise<TodoWithCategories> {
    const startedAt = durationSeconds === null ? null : new Date();

    const todo = await this.repository.setTimer(
      userId,
      id,
      startedAt,
      durationSeconds,
    );

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

  /** Setzt die komplette Label-Menge eines Todos (n:m). */
  async setCategories(
    userId: string,
    id: string,
    categoryIds: string[],
  ): Promise<TodoWithCategories> {
    const uniqueIds = [...new Set(categoryIds)];

    // Jedes Label muss dem Nutzer gehören — kein Fremd-Label unterjubeln.
    for (const categoryId of uniqueIds) {
      await this.assertCategoryOwnership(userId, categoryId);
    }

    const todo = await this.repository.setCategories(userId, id, uniqueIds);

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

  async deleteTodo(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(userId, id);

    if (!deleted) {
      throw new NotFoundException('Todo not found');
    }
  }
  private async assertCategoryOwnership(
  userId: string,
  categoryId: string | null | undefined,
): Promise<void> {
  if (categoryId === null || categoryId === undefined) {
    return;
  }

  const belongsToUser =
    await this.repository.categoryBelongsToUser(
      userId,
      categoryId,
    );

  if (!belongsToUser) {
    throw new BadRequestException(
      'Category does not exist for this user',
    );
  }
}

}

