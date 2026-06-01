// src/todo/todo.controller.ts
import { Body, Controller, Post, Param, Get, Query, Put, Delete } from '@nestjs/common';
import { TodoService } from './todo.service';
import type { Filter, Todo } from './todo.model';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CurrentUserId } from '../auth/current-user.decorater';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  getAllTodos(
    @CurrentUserId() userId: string,
    @Query('filter') filter: Filter,
  ): TodoResponseDto {
    const todo = this.todoService.findAll(userId, filter);
    return new TodoResponseDto(todo);
  }

  @Get(':id')
  getTodoById(@CurrentUserId() userId: string, @Param('id') id: string): Todo {
    return this.todoService.findById(userId, id);
  }

  @Post()
  createTodo(
    @CurrentUserId() userId: string,
    @Body() createTodoDto: CreateTodoDto,
  ): Todo {
    return this.todoService.createTodo(userId, createTodoDto);
  }

  @Put(':id')
  updateTodo(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Todo {
    return this.todoService.updateTodo(userId, id, updateTodoDto);
  }

  @Delete(':id')
  deleteTodo(@CurrentUserId() userId: string, @Param('id') id: string): void {
    this.todoService.deleteTodo(userId, id);
  }
}