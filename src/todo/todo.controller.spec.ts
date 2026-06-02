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

it('should list all todos', () => {
  const todos = [
    { id: '1', userId: 'test_user', title: 'Todo 1', completed: false, createdAt: new Date() },
  ];
  todoService.findAll.mockReturnValue(todos);

  const result = controller.getAllTodos('test_user', 'all');

  expect(result.todo).toEqual(todos);
  expect(result.total).toBe(1);
  expect(todoService.findAll).toHaveBeenCalledWith('test_user', 'all');
});

it('should return todo by id', () => {
  const todo = { id: '1', userId: 'test_user', title: 'Todo 1', completed: false, createdAt: new Date() };
  todoService.findById.mockReturnValue(todo);

  const result = controller.getTodoById('test_user', '1');

  expect(result).toEqual(todo);
  expect(todoService.findById).toHaveBeenCalledWith('test_user', '1');
});

it('should create todo', () => {
  const todo = { id: '1', userId: 'test_user', title: 'Todo 1', completed: false, createdAt: new Date() };
  todoService.createTodo.mockReturnValue(todo);

  const result = controller.createTodo('test_user', { title: 'Todo 1' });

  expect(result).toEqual(todo);
  expect(todoService.createTodo).toHaveBeenCalledWith('test_user', { title: 'Todo 1' });
});

  });