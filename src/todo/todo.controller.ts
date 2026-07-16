// src/todo/todo.controller.ts
import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import type { Filter } from './todo.model';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ReorderTodosDto } from './dto/reorder-todos.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { TodoItemResponseDto } from './dto/todo-item-response.dto';
import { toTodoItemResponse } from './todo.mapper';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  async getAllTodos(
    @CurrentUserId() userId: string,
    @Query('filter') filter: Filter,
  ): Promise<TodoResponseDto> {
    const items = await this.todoService.findAll(userId, filter);

    return new TodoResponseDto(
      items.map(toTodoItemResponse),
    );
  }

  // Muss vor den ':id'-Routen stehen, sonst wird 'reorder' als id interpretiert.
  @Put('reorder')
  reorderTodos(
    @CurrentUserId() userId: string,
    @Body() reorderTodosDto: ReorderTodosDto,
  ): Promise<void> {
    return this.todoService.reorder(userId, reorderTodosDto.ids);
  }

@Get(':id')
  async getTodoById(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<TodoItemResponseDto> {
    const todo = await this.todoService.findById(userId, id);

    return toTodoItemResponse(todo);
  }

@Post()
  async createTodo(
    @CurrentUserId() userId: string,
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<TodoItemResponseDto> {
    const todo = await this.todoService.createTodo(
      userId,
      createTodoDto,
    );

  return toTodoItemResponse(todo);
}

  @Put(':id')
  async updateTodo(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoItemResponseDto> {
    const todo = await this.todoService.updateTodo(
      userId,
      id,
      updateTodoDto,
    );

  return toTodoItemResponse(todo);
}

  @Delete(':id')
  deleteTodo(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.todoService.deleteTodo(userId, id);
  }
}