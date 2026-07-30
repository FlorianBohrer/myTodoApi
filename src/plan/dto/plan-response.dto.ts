import type { Plan } from '../../drizzle/schema';

export class PlanResponseDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly categoryId: string | null,
    public readonly content: unknown[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export function toPlanResponse(plan: Plan): PlanResponseDto {
  return new PlanResponseDto(
    plan.id,
    plan.title,
    plan.categoryId,
    plan.content,
    plan.createdAt,
    plan.updatedAt,
  );
}

export class PlanListResponseDto {
  readonly plans: PlanResponseDto[];
  readonly total: number;
  constructor(plans: PlanResponseDto[]) {
    this.plans = plans;
    this.total = plans.length;
  }
}
