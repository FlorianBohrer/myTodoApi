import { Body, Controller, Post, Param, Get, Query, Put, Delete } from '@nestjs/common';
import { TodoService } from './todo.service';
import type { Filter, Todo } from './todo.model';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';


@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService) {}

    @Get()
    getAllTodos(@Query('filter') filter: Filter): TodoResponseDto{
        const todo = this.todoService.findAll(filter);
        return new TodoResponseDto(todo);
    }

    @Get(':id')
    getTodoById(@Param('id') id: string): Todo {
        return this.todoService.findById(id);
    }

    @Post()
    createTodo(@Body() createTodoDto: CreateTodoDto): Todo {
        return this.todoService.createTodo(createTodoDto);
    }

    @Put(':id')
    updateTodo(
        @Param('id') id: string, 
        @Body() updateTodoDto: UpdateTodoDto
    ): Todo {
        return this.todoService.updateTodo(id, updateTodoDto);
    }

    @Delete(':id')
    deleteTodo(@Param('id') id: string): void {
        this.todoService.deleteTodo(id);
    }
    
}

