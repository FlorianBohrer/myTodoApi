import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { TodoService } from './todo.service';

import { TODO_REPOSITORY, TodoRepository } from './todo-repository';
describe('TodoService', () => {
  let service: TodoService;
  let repository: jest.Mocked<TodoRepository>;

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
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