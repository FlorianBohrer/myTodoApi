import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';
import { NotFoundException } from '@nestjs/common';


describe('TodoService', () => {
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodoService],
    }).compile();

    service = module.get<TodoService>(TodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return all todos when filter = all', () => {
    service.createTodo({ title: 'Todo 1' });
    service.createTodo({ title: 'Todo 2' });
    service.createTodo({ title: 'Todo 3' });
    const result = service.findAll('all');
    expect(result).toHaveLength(3);
  });
  it('should return active todos when filter = active', () => {
    const todo1 = service.createTodo({ title: 'Todo 1' });
    service.createTodo({ title: 'Todo 2' });
    service.createTodo({ title: 'Todo 3' });
    service.updateTodo(todo1.id, { completed: true });
    const result = service.findAll('active');
    expect(result).toHaveLength(2);
  });
  it('should return completed todos when filter = completed', () => {
    const todo1 = service.createTodo({ title: 'Todo 1' });
    service.createTodo({ title: 'Todo 2' });
    service.createTodo({ title: 'Todo 3' });
    service.updateTodo(todo1.id, { completed: true });
    const result = service.findAll('completed');
    expect(result).toHaveLength(1);
  });
  it('should return todo by id', () => {
    const todo = service.createTodo({ title: 'Todo 1' });
    const result = service.findById(todo.id);
    expect(result).toEqual(todo);
  });
  it('should delete todo by id and then findById should throw', () => {
    const todo = service.createTodo({ title: 'Todo 1' });
    service.deleteTodo(todo.id);
    expect(() => service.findById(todo.id)).toThrow(NotFoundException);
  });
  
});