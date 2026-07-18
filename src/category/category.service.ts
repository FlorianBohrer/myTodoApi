import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Category } from '../drizzle/schema';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from './category-repository';

// Es können maximal drei Folder gleichzeitig favorisiert sein (Plätze 0–2).
const FAVORITE_POSITIONS = [0, 1, 2];

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repository: CategoryRepository,
  ) {}

  findAll(userId: string): Promise<Category[]> {
    return this.repository.findAll(userId);
  }

  createCategory(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.repository.create(userId, dto);
  }

  reorder(userId: string, ids: string[]): Promise<void> {
    return this.repository.reorder(userId, ids);
  }

  async updateCategory(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.repository.update(userId, id, dto);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(userId, id);

    if (!deleted) {
      throw new NotFoundException('Category not found');
    }
  }

  /**
   * Favorit setzen oder entfernen. Beim Setzen wird der erste freie Platz
   * (0–2) vergeben; sind alle belegt, ist Schluss (ConflictException).
   */
  async setFavorite(
    userId: string,
    id: string,
    favorite: boolean,
  ): Promise<Category> {
    const category = await this.repository.findById(userId, id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!favorite) {
      return this.persistFavoritePosition(userId, id, null);
    }

    // Schon Favorit -> Platz behalten, nichts zu tun.
    if (category.favoritePosition !== null) {
      return category;
    }

    const usedPositions = new Set(
      await this.repository.findUsedFavoritePositions(userId),
    );
    const freePosition = FAVORITE_POSITIONS.find(
      (position) => !usedPositions.has(position),
    );

    if (freePosition === undefined) {
      throw new ConflictException(
        'Es können maximal drei Folder favorisiert werden',
      );
    }

    return this.persistFavoritePosition(userId, id, freePosition);
  }

  private async persistFavoritePosition(
    userId: string,
    id: string,
    position: number | null,
  ): Promise<Category> {
    const category = await this.repository.setFavoritePosition(
      userId,
      id,
      position,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }
}
