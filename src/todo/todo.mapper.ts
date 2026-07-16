import type { Todo } from '../drizzle/schema';
import { TodoItemResponseDto } from './dto/todo-item-response.dto';

export function toTodoItemResponse(
  todo: Todo,
): TodoItemResponseDto {
  return new TodoItemResponseDto(
    todo.id,
    todo.title,
    todo.completed,
    todo.isFavorite,
    todo.categoryId,
    todo.createdAt,
  );
}
