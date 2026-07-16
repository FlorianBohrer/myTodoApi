
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Todo } from '../drizzle/schema';
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

  async findAll(userId: string, filter: Filter): Promise<Todo[]> {
    const items = await this.repository.findAll(userId);

    if (filter === 'active') {
      return items.filter((todo) => !todo.completed);
    }

    if (filter === 'completed') {
      return items.filter((todo) => todo.completed);
    }

    return items;
  }

  async findById(userId: string, id: string): Promise<Todo> {
    const todo = await this.repository.findById(userId, id);

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

async createTodo(
  userId: string,
  dto: CreateTodoDto,
): Promise<Todo> {
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
): Promise<Todo> {
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

