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
            reorder: jest.fn()
          },
        },
      ],
    }).compile();

    controller = module.get<TodoController>(TodoController);
    todoService = module.get<TodoService>(
      TodoService
    ) as jest.Mocked<TodoService>;
  });

it('should list all todos', async () => {
  const todos = [
    {
      id: '1',
      userId: 'test_user',
      title: 'Todo 1',
      completed: false,
      isFavorite: false,
      categoryId: null,
      position: 0,
      createdAt: new Date(),
    },
  ];

  todoService.findAll.mockResolvedValue(todos);

  const result = await controller.getAllTodos('test_user', 'all');

  expect(result.todo).toEqual([
  {
    id: todos[0].id,
    title: todos[0].title,
    completed: todos[0].completed,
    isFavorite: todos[0].isFavorite,
    categoryId: todos[0].categoryId,
    createdAt: todos[0].createdAt,
  },
]);

expect(result.todo[0]).not.toHaveProperty('userId');
expect(result.todo[0]).not.toHaveProperty('position');
  expect(result.total).toBe(1);
  expect(todoService.findAll).toHaveBeenCalledWith('test_user', 'all');
});

it('should return todo by id without internal fields', async () => {
  const todo = {
    id: '1',
    userId: 'test_user',
    title: 'Todo 1',
    completed: false,
    isFavorite: false,
    categoryId: null,
    position: 0,
    createdAt: new Date(),
  };

  todoService.findById.mockResolvedValue(todo);

  const result = await controller.getTodoById(
    'test_user',
    '1',
  );

  expect(result).toEqual({
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    isFavorite: todo.isFavorite,
    categoryId: todo.categoryId,
    createdAt: todo.createdAt,
  });

  expect(result).not.toHaveProperty('userId');
  expect(result).not.toHaveProperty('position');

  expect(todoService.findById).toHaveBeenCalledWith(
    'test_user',
    '1',
  );
});

it('should create todo', async () => {
  const todo = {
    id: '1',
    userId: 'test_user',
    title: 'Todo 1',
    completed: false,
    isFavorite: false,
    categoryId: null,
    position: 0,
    createdAt: new Date(),
  };
  todoService.createTodo.mockResolvedValue(todo);

  const result = await controller.createTodo('test_user', { title: 'Todo 1' });

  expect(result).toEqual({
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  isFavorite: todo.isFavorite,
  categoryId: todo.categoryId,
  createdAt: todo.createdAt,
});

expect(result).not.toHaveProperty('userId');
expect(result).not.toHaveProperty('position');
  expect(todoService.createTodo).toHaveBeenCalledWith('test_user', { title: 'Todo 1' });
});

  });