import { Module } from '@nestjs/common';

import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { TODO_REPOSITORY } from '../todo/todo-repository';
import { DrizzleTodoRepository } from './drizzle-todo.repository';

@Module({
  controllers: [TodoController],
  providers: [
    TodoService,
    {
      provide: TODO_REPOSITORY,
      useClass: DrizzleTodoRepository,
    },
  ],
})
export class TodoModule {}