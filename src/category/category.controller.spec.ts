import { Test, type TestingModule } from '@nestjs/testing';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let categoryService: jest.Mocked<CategoryService>;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [CategoryController],
        providers: [
          {
            provide: CategoryService,
            useValue: {
              findAll: jest.fn(),
              createCategory: jest.fn(),
              updateCategory: jest.fn(),
              deleteCategory: jest.fn(),
              setFavorite: jest.fn(),
            },
          },
        ],
      }).compile();

    controller = module.get(CategoryController);
    categoryService = module.get(CategoryService);
  });

  it('should not expose internal category fields', async () => {
    const category = {
      id: '11111111-1111-4111-8111-111111111111',
      userId: 'user_123',
      name: 'Work',
      color: 'rose',
      icon: 'briefcase',
      favoritePosition: 0,
      createdAt: new Date(),
    };

    categoryService.findAll.mockResolvedValue([
      category,
    ]);

    const result =
      await controller.getAllCategories('user_123');

    expect(result.categories).toEqual([
      {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        favoritePosition: category.favoritePosition,
      },
    ]);

    expect(result.categories[0]).not.toHaveProperty(
      'userId',
    );

    expect(result.categories[0]).not.toHaveProperty(
      'createdAt',
    );

    expect(result.total).toBe(1);
  });
});