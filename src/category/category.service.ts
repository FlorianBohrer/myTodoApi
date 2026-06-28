import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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
}
