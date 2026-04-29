import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import type { Filter, Todo } from './todo.model';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoDto } from './dto/create-todo.dto';


@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService) {}

    @Get()
    getAllTodos(@Query('filter') filter: Filter): TodoResponseDto{
        const todo = this.todoService.findAll(filter);
        return new TodoResponseDto(todo);
    }

    @Post()
    createTodo(@Body() createTodoDto: CreateTodoDto): Todo {
        return this.todoService.createTodo(createTodoDto);
    }
}

