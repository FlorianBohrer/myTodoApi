import { Todo } from "../todo.model";

export class TodoResponseDto { 
    todo: Todo[];
    total: number;

    constructor(todo: Todo[]) {
        this.todo = todo;
        this.total = todo.length;
    }
}