import { Injectable } from '@nestjs/common';
import { Filter, Todo } from './todo.model';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
    private todo: Todo[] = [];
    
    findAll(filter: Filter): Todo[] {
        let items = this.todo;
        if (filter === 'active') items = items.filter((item) => !item.completed);
        if (filter === 'completed') items = items.filter((item) => item.completed);
        return items;
    }

    createTodo(createTodoDto: CreateTodoDto): Todo {
        const todo =  Todo = {
            id: crypto.randomUUID(),
            title: createTodoDto.title,
            completed: false,
            createdAt: new Date(),
        };
        this.todo.push(todo);
        return todo;
    }
      
}
