import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { categories, Category } from '../drizzle/schema';

import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './category-repository';

@Injectable()
export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findAll(userId: string): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.position), asc(categories.createdAt));
  }

  async findById(userId: string, id: string): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));

    return category ?? null;
  }

  async create(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    // Neue Folder hinten anhängen, sonst landen sie zwischen den sortierten.
    const [{ maxPosition }] = await this.db
      .select({
        maxPosition: sql<number>`coalesce(max(${categories.position}), -1)`,
      })
      .from(categories)
      .where(eq(categories.userId, userId));

    const [category] = await this.db
      .insert(categories)
      .values({
        userId,
        name: dto.name,
        color: dto.color,
        icon: dto.icon ?? 'tag',
        position: maxPosition + 1,
      })
      .returning();

    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category | null> {
    const [category] = await this.db
      .update(categories)
      .set(dto)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return category ?? null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [category] = await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return category !== undefined;
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) =>
        this.db
          .update(categories)
          .set({ position: index })
          .where(and(eq(categories.id, id), eq(categories.userId, userId))),
      ),
    );
  }

  async findUsedFavoritePositions(userId: string): Promise<number[]> {
    const rows = await this.db
      .select({ position: categories.favoritePosition })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          isNotNull(categories.favoritePosition),
        ),
      );

    return rows
      .map((row) => row.position)
      .filter((position): position is number => position !== null);
  }

  async setFavoritePosition(
    userId: string,
    id: string,
    position: number | null,
  ): Promise<Category | null> {
    const [category] = await this.db
      .update(categories)
      .set({ favoritePosition: position })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return category ?? null;
  }
}
