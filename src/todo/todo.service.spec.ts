import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';
import { NotFoundException } from '@nestjs/common';

describe('TodoService', () => {
  let service: TodoService;
  const userId = 'user_123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodoService],
    }).compile();
    service = module.get<TodoService>(TodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all todos of the user when filter = all', () => {
    service.createTodo(userId, { title: 'Todo 1' });
    service.createTodo(userId, { title: 'Todo 2' });
    expect(service.findAll(userId, 'all')).toHaveLength(2);
  });

  it('should only return the current users todos', () => {
    service.createTodo(userId, { title: 'Mein Todo' });
    service.createTodo('user_other', { title: 'Fremdes Todo' });
    const result = service.findAll(userId, 'all');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Mein Todo');
  });

  it('should return active todos when filter = active', () => {
    const todo1 = service.createTodo(userId, { title: 'Todo 1' });
    service.createTodo(userId, { title: 'Todo 2' });
    service.updateTodo(userId, todo1.id, { completed: true });
    expect(service.findAll(userId, 'active')).toHaveLength(1);
  });

  it('should not find another users todo by id', () => {
    const foreign = service.createTodo('user_other', { title: 'Fremd' });
    expect(() => service.findById(userId, foreign.id)).toThrow(NotFoundException);
  });

  it('should delete own todo and then findById should throw', () => {
    const todo = service.createTodo(userId, { title: 'Todo 1' });
    service.deleteTodo(userId, todo.id);
    expect(() => service.findById(userId, todo.id)).toThrow(NotFoundException);
  });
});