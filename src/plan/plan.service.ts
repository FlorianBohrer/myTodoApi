import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { plans, categories, Plan } from '../drizzle/schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(userId: string): Promise<Plan[]> {
    return this.db
      .select()
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(asc(plans.position), desc(plans.updatedAt));
  }

  async findById(userId: string, id: string): Promise<Plan> {
    const [plan] = await this.db
      .select()
      .from(plans)
      .where(and(eq(plans.id, id), eq(plans.userId, userId)));
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(userId: string, dto: CreatePlanDto): Promise<Plan> {
    await this.assertCategoryOwnership(userId, dto.categoryId);
    const [plan] = await this.db
      .insert(plans)
      .values({ userId, title: dto.title, categoryId: dto.categoryId ?? null })
      .returning();
    return plan;
  }

  async updatePlan(
    userId: string,
    id: string,
    dto: UpdatePlanDto,
  ): Promise<Plan> {
    await this.assertCategoryOwnership(userId, dto.categoryId);
    const [plan] = await this.db
      .update(plans)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(plans.id, id), eq(plans.userId, userId)))
      .returning();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async deletePlan(userId: string, id: string): Promise<void> {
    const [plan] = await this.db
      .delete(plans)
      .where(and(eq(plans.id, id), eq(plans.userId, userId)))
      .returning();
    if (!plan) throw new NotFoundException('Plan not found');
  }

  /** Ein zugewiesener Folder muss dem Nutzer gehören. */
  private async assertCategoryOwnership(
    userId: string,
    categoryId: string | null | undefined,
  ): Promise<void> {
    if (categoryId === null || categoryId === undefined) return;
    const [category] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);
    if (!category) {
      throw new BadRequestException('Category does not exist for this user');
    }
  }
}
