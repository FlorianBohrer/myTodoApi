import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CurrentUserId } from '../auth/current-user.decorator';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import {
  PlanListResponseDto,
  PlanResponseDto,
  toPlanResponse,
} from './dto/plan-response.dto';

@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getAll(
    @CurrentUserId() userId: string,
  ): Promise<PlanListResponseDto> {
    const plans = await this.planService.findAll(userId);
    return new PlanListResponseDto(plans.map(toPlanResponse));
  }

  @Get(':id')
  async getOne(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<PlanResponseDto> {
    return toPlanResponse(await this.planService.findById(userId, id));
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreatePlanDto,
  ): Promise<PlanResponseDto> {
    return toPlanResponse(await this.planService.createPlan(userId, dto));
  }

  @Put(':id')
  async update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return toPlanResponse(await this.planService.updatePlan(userId, id, dto));
  }

  @Delete(':id')
  delete(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.planService.deletePlan(userId, id);
  }
}
