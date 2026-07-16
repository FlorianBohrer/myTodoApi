import type { Todo } from '../drizzle/schema';
import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';

export const TODO_REPOSITORY = Symbol('TODO_REPOSITORY');

export interface TodoRepository {
  findAll(userId: string): Promise<Todo[]>;
  findById(userId: string, id: string): Promise<Todo | null>;
  create(userId: string, dto: CreateTodoDto): Promise<Todo>;
  update(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<Todo | null>;
  delete(userId: string, id: string): Promise<boolean>;
  reorder(userId: string, ids: string[]): Promise<void>;
}