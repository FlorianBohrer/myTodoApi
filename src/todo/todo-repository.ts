import type { TodoWithCategories } from '../drizzle/schema';
import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';

export const TODO_REPOSITORY = Symbol('TODO_REPOSITORY');

export interface TodoRepository {
  findAll(userId: string): Promise<TodoWithCategories[]>;
  findById(userId: string, id: string): Promise<TodoWithCategories | null>;

  categoryBelongsToUser(
    userId: string,
    categoryId: string,
  ): Promise<boolean>;

  create(userId: string, dto: CreateTodoDto): Promise<TodoWithCategories>;

  update(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<TodoWithCategories | null>;

  /** Ersetzt die komplette Label-Menge eines Todos (n:m). */
  setCategories(
    userId: string,
    id: string,
    categoryIds: string[],
  ): Promise<TodoWithCategories | null>;

  setTimer(
    userId: string,
    id: string,
    startedAt: Date | null,
    durationSeconds: number | null,
  ): Promise<TodoWithCategories | null>;

  delete(userId: string, id: string): Promise<boolean>;
  reorder(userId: string, ids: string[]): Promise<void>;
}
