import { Injectable, NotFoundException } from '@nestjs/common';
import { Filter, Todo } from './todo.model';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  private todos: Todo[] = [];

  findAll(userId: string, filter: Filter): Todo[] {
    let items = this.todos.filter((t) => t.userId === userId);
    if (filter === 'active') items = items.filter((t) => !t.completed);
    if (filter === 'completed') items = items.filter((t) => t.completed);
    return items;
  }

  findById(userId: string, id: string): Todo {
    const todo = this.todos.find((t) => t.id === id && t.userId === userId);
    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  createTodo(userId: string, createTodoDto: CreateTodoDto): Todo {
    const todo: Todo = {
      id: crypto.randomUUID(),
      userId,
      title: createTodoDto.title,
      completed: false,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
  }

  updateTodo(userId: string, id: string, updateTodoDto: UpdateTodoDto): Todo {
    const todo = this.findById(userId, id);
    Object.assign(todo, updateTodoDto);
    return todo;
  }

  deleteTodo(userId: string, id: string): void {
    this.findById(userId, id);
    this.todos = this.todos.filter((t) => t.id !== id);
  }
}