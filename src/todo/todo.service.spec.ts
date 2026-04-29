import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';

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
  it('should return all todos with filter = "all"', () => {
    service.createTodo({ title: 'Todo 1' });  
    service.createTodo({ title: 'Todo 2' });
    service.createTodo({ title: 'Todo 3' });
    const result = service.findAll('all');
    expect(result.length).toBe(3);
  }
  );
  it('should return only active todos with filter "active"', () => {
    const result = service.findAll('active');
    expect(result.length).toBe(2);
    expect(result.every(todo => !todo.completed)).toBe(true);
  });
  it('should return only completed todos with filter "completed"', () => {
    const result = service.findAll('completed');
    expect(result.length).toBe(1);
    expect(result.every(todo => todo.completed)).toBe(true);
  });
});
