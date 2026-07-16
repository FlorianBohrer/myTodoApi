import { 
  ConflictException,
  Inject, 
  Injectable, 
  NotFoundException
} from '@nestjs/common';
import { and, eq , isNotNull} from 'drizzle-orm';
import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { categories, Category } from '../drizzle/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(userId: string): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
  }

  async createCategory(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const [category] = await this.db
      .insert(categories)
      .values({
        userId,
        name: dto.name,
        color: dto.color,
        icon: dto.icon ?? 'tag',
      })
      .returning();
    return category;
  }

  async updateCategory(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const [category] = await this.db
      .update(categories)
      .set(dto)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const [category] = await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    if (!category) throw new NotFoundException('Category not found');
  }
      
    async setFavorite(
  userId: string,
  id: string,
  favorite: boolean,
): Promise<Category> {
  // 1. Folder suchen
  const [category] = await this.db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, id),
        eq(categories.userId, userId),
      ),
    );

  // 2. Folder existiert nicht oder gehört einem anderen Nutzer
  if (!category) {
    throw new NotFoundException('Category not found');
  }

  // 3. Favorit entfernen
  if (!favorite) {
    const [updatedCategory] = await this.db
      .update(categories)
      .set({
        favoritePosition: null,
      })
      .where(
        and(
          eq(categories.id, id),
          eq(categories.userId, userId),
        ),
      )
      .returning();

    return updatedCategory;
  }

  // 4. Folder ist bereits Favorit
  if (category.favoritePosition !== null) {
    return category;
  }

  // 5. Bisherige Favoriten laden
  const favorites = await this.db
    .select({
      position: categories.favoritePosition,
    })
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        isNotNull(categories.favoritePosition),
      ),
    );

  // 6. Belegte Plätze sammeln
  const usedPositions = new Set(
    favorites
      .map(item => item.position)
      .filter((position): position is number => position !== null),
  );

  // 7. Freien Platz suchen
  const freePosition = [0, 1, 2].find(
    position => !usedPositions.has(position),
  );

  // 8. Kein Platz mehr vorhanden
  if (freePosition === undefined) {
    throw new ConflictException(
      'Es können maximal drei Folder favorisiert werden',
    );
  }

  // 9. Folder auf dem freien Platz speichern
  const [updatedCategory] = await this.db
    .update(categories)
    .set({
      favoritePosition: freePosition,
    })
    .where(
      and(
        eq(categories.id, id),
        eq(categories.userId, userId),
      ),
    )
    .returning();

  return updatedCategory;
}
}