// src/todo/todo.controller.ts
import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  Query,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import type { Filter } from './todo.model';
import { ArchivedCountDto, SetArchivedDto } from './dto/set-archived.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ReorderTodosDto } from './dto/reorder-todos.dto';
import { SetTimerDto } from './dto/set-timer.dto';
import { SetCategoriesDto } from './dto/set-categories.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { NextOccurrenceDto } from './dto/todo-item-response.dto';
import { TodoItemResponseDto } from './dto/todo-item-response.dto';
import { toTodoItemResponse } from './todo.mapper';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  async getAllTodos(
    @CurrentUserId() userId: string,
    @Query('filter') filter: Filter,
    // Archiviertes kommt nur mit, wenn ausdruecklich danach gefragt wird.
    // Alles andere in der App rechnet mit der Liste ohne Archiv.
    @Query('archived') archived?: string,
  ): Promise<TodoResponseDto> {
    const items = await this.todoService.findAll(
      userId,
      filter,
      archived === 'true',
    );

    return new TodoResponseDto(
      items.map(toTodoItemResponse),
    );
  }

  /**
   * Alles Erledigte auf einmal weglegen.
   *
   * Muss wie 'reorder' VOR den ':id'-Routen stehen, sonst landet
   * 'archive-completed' als id in updateTodo.
   */
  @Post('archive-completed')
  async archiveCompleted(
    @CurrentUserId() userId: string,
  ): Promise<ArchivedCountDto> {
    return new ArchivedCountDto(
      await this.todoService.archiveCompleted(userId),
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
    const { todo, nextOccurrence } = await this.todoService.updateTodo(
      userId,
      id,
      updateTodoDto,
    );

    return {
      ...toTodoItemResponse(todo),
      nextOccurrence: nextOccurrence
        ? new NextOccurrenceDto(nextOccurrence.id, nextOccurrence.scheduledDate)
        : null,
    };
}

  @Put(':id/categories')
  async setCategories(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() setCategoriesDto: SetCategoriesDto,
  ): Promise<TodoItemResponseDto> {
    const todo = await this.todoService.setCategories(
      userId,
      id,
      setCategoriesDto.categoryIds,
    );

    return toTodoItemResponse(todo);
  }

  @Patch(':id/archive')
  async setArchived(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: SetArchivedDto,
  ): Promise<TodoItemResponseDto> {
    const todo = await this.todoService.setArchived(userId, id, dto.archived);

    return toTodoItemResponse(todo);
  }

  @Patch(':id/timer')
  async setTimer(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() setTimerDto: SetTimerDto,
  ): Promise<TodoItemResponseDto> {
    const todo = await this.todoService.setTimer(
      userId,
      id,
      setTimerDto.durationSeconds,
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