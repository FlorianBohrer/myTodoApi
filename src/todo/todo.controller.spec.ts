import { Test, TestingModule } from '@nestjs/testing';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';


describe('TodoController', () => {
  let controller: TodoController;
  let todoService: jest.Mocked<TodoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        {
          provide: TodoService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            createTodo: jest.fn(),
            updateTodo: jest.fn(),
            deleteTodo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TodoController>(TodoController);
    todoService = module.get<TodoService>(
      TodoService
    ) as jest.Mocked<TodoService>;
  });

   // src/todo/todo.controller.spec.ts (nur die geänderten Tests)
it('should list all todos', () => {
  const todos = [
    { id: '1', userId: 'test_user', title: 'Todo 1', completed: false, createdAt: new Date() },
  ];
  todoService.findAll.mockReturnValue(todos);

  const result = controller.getAllTodos('user_123', 'all');

  expect(result.todo).toEqual(todos);
  expect(result.total).toBe(1);
  expect(todoService.findAll).toHaveBeenCalledWith('user_123', 'all');
});

it('should return todo by id', () => {
  const todo = { id: '1', userId: 'user_123', title: 'Todo 1', completed: false, createdAt: new Date() };
  todoService.findById.mockReturnValue(todo);

  const result = controller.getTodoById('user_123', '1');

  expect(result).toEqual(todo);
  expect(todoService.findById).toHaveBeenCalledWith('user_123', '1');
});

it('should create todo', () => {
  const todo = { id: '1', userId: 'user_123', title: 'Todo 1', completed: false, createdAt: new Date() };
  todoService.createTodo.mockReturnValue(todo);

  const result = controller.createTodo('user_123', { title: 'Todo 1' });

  expect(result).toEqual(todo);
  expect(todoService.createTodo).toHaveBeenCalledWith('user_123', { title: 'Todo 1' });
});

  });