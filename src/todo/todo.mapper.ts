import type { TodoWithCategories } from '../drizzle/schema';
import { TodoItemResponseDto } from './dto/todo-item-response.dto';

export function toTodoItemResponse(
  todo: TodoWithCategories,
): TodoItemResponseDto {
  return new TodoItemResponseDto(
    todo.id,
    todo.title,
    todo.completed,
    todo.isFavorite,
    todo.categoryId,
    todo.categoryIds,
    todo.createdAt,
    todo.timerStartedAt,
    todo.timerDurationSeconds,
  );
}
