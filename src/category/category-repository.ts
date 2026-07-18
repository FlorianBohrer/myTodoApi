import type { Category } from '../drizzle/schema';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
  findAll(userId: string): Promise<Category[]>;
  findById(userId: string, id: string): Promise<Category | null>;
  create(userId: string, dto: CreateCategoryDto): Promise<Category>;
  update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category | null>;
  delete(userId: string, id: string): Promise<boolean>;
  reorder(userId: string, ids: string[]): Promise<void>;

  /** Belegte Favoriten-Plätze (0–2) des Nutzers. */
  findUsedFavoritePositions(userId: string): Promise<number[]>;

  /** Favoriten-Platz setzen (null = kein Favorit). */
  setFavoritePosition(
    userId: string,
    id: string,
    position: number | null,
  ): Promise<Category | null>;
}
