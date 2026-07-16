import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TodoService } from './todo.service';

import { TODO_REPOSITORY, TodoRepository } from './todo-repository';
describe('TodoService', () => {
  let service: TodoService;
  let repository: jest.Mocked<TodoRepository>;

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      categoryBelongsToUser:jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: TODO_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(TodoService);
  });

    it('rejects a category that does not belong to the user', async () => {
    repository.categoryBelongsToUser.mockResolvedValue(false);

    await expect(
      service.createTodo('user_123', {
        title: 'Private Todo',
        categoryId: '11111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates a todo when the category belongs to the user', async () => {
  const todo = {
    id: '22222222-2222-4222-8222-222222222222',
    userId: 'user_123',
    title: 'My Todo',
    completed: false,
    isFavorite: false,
    categoryId: '11111111-1111-4111-8111-111111111111',
    position: 0,
    createdAt: new Date(),
  };

  repository.categoryBelongsToUser.mockResolvedValue(true);
  repository.create.mockResolvedValue(todo);

  const result = await service.createTodo('user_123', {
    title: 'My Todo',
    categoryId: todo.categoryId,
  });

  expect(result).toEqual(todo);

  expect(
    repository.categoryBelongsToUser,
  ).toHaveBeenCalledWith(
    'user_123',
    todo.categoryId,
  );
});

it('creates a todo without checking ownership when category is null', async () => {
  const todo = {
    id: '22222222-2222-4222-8222-222222222222',
    userId: 'user_123',
    title: 'Uncategorized',
    completed: false,
    isFavorite: false,
    categoryId: null,
    position: 0,
    createdAt: new Date(),
  };

  repository.create.mockResolvedValue(todo);

  await service.createTodo('user_123', {
    title: 'Uncategorized',
    categoryId: null,
  });

  expect(
    repository.categoryBelongsToUser,
  ).not.toHaveBeenCalled();

  expect(repository.create).toHaveBeenCalled();
});

it('rejects updating a todo with a foreign category', async () => {
  repository.categoryBelongsToUser.mockResolvedValue(false);

  await expect(
    service.updateTodo('user_123', 'todo_123', {
      categoryId: '11111111-1111-4111-8111-111111111111',
    }),
  ).rejects.toThrow(BadRequestException);

  expect(repository.update).not.toHaveBeenCalled();
});

  it('should return only active todos', async () => {
    const openTodo = {
      id: '1',
      userId: 'user_123',
      title: 'Open',
      completed: false,
      isFavorite: false,
      categoryId: null,
      position: 0,
      createdAt: new Date(),
    };

    const databaseTodo = {
      id: '11111111-1111-4111-8111-111111111111',
      userId: 'user_123',
      title: 'Todo 1',
      completed: false,
      isFavorite: false,
      categoryId: null,
      position: 0,
      createdAt: new Date(),
    };

    const completedTodo = {
      ...openTodo,
      id: '2',
      title: 'Completed',
      completed: true,
      position: 1,
    };

    repository.findAll.mockResolvedValue([
      openTodo,
      completedTodo,
    ]);

    const result = await service.findAll('user_123', 'active');

    expect(result).toEqual([openTodo]);
    expect(repository.findAll).toHaveBeenCalledWith('user_123');
  });

  it('should throw when todo does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.findById('user_123', 'missing'),
    ).rejects.toThrow(NotFoundException);
  });
});