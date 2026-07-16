import type { TodoItemResponseDto } from './todo-item-response.dto';

export class TodoResponseDto {
  readonly todo: TodoItemResponseDto[];
  readonly total: number;

  constructor(todo: TodoItemResponseDto[]) {
    this.todo = todo;
    this.total = todo.length;
  }
}