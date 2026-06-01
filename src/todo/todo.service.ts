import { Injectable, NotFoundException } from '@nestjs/common';
import { Filter, Todo } from './todo.model';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
    private todo: Todo[] = [];
    
    findAll(filter: Filter): Todo[] {
        let items = this.todo;
        if (filter === 'active') items = items.filter((item) => !item.completed);
        if (filter === 'completed') items = items.filter((item) => item.completed);
        return items;
    }

    findById(id: string): Todo {
        const todo = this.todo.find((t) => t.id === id);
        if (!todo) throw new NotFoundException('Todo not found');
        return todo;
    }

    createTodo(createTodoDto: CreateTodoDto): Todo {
        const todo: Todo = {
            id: crypto.randomUUID(),
            title: createTodoDto.title,
            completed: false,
            createdAt: new Date(),
        };
        this.todo.push(todo);
        return todo;
    }
    
    updateTodo(id: string, updateTodoDto: UpdateTodoDto): Todo {
        let updatedTodo: Todo | undefined;
        this.todo = this.todo.map((t) => {
            if (t.id !== id) return t;
            updatedTodo = { ...t, ...updateTodoDto };
            return updatedTodo;
        });
        if (!updatedTodo) throw new NotFoundException('Todo not found');
        return updatedTodo;
    }

    deleteTodo(id: string): void {
        this.todo = this.todo.filter((t) => t.id !== id);
    }
}