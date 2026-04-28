import { Injectable } from '@nestjs/common';
import { Filter, Todo } from './todo.model';

@Injectable()
export class TodoService {
    private todo: Todo[] = [];
    
    findAll(filter: Filter): Todo[] {
        let items = this.todo;
        if (filter === 'active') items = items.filter((item) => !item.completed);
        if (filter === 'completed') items = items.filter((item) => item.completed);
        return items;
    }
}
