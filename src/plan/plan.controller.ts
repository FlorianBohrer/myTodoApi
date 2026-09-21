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
import { AiService } from '../ai/ai.service';
import { CurrentUserId } from '../auth/current-user.decorator';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ReorderPlansDto } from './dto/reorder-plans.dto';
import {
  SuggestTitleDto,
  SuggestTitleResponseDto,
} from './dto/suggest-title.dto';
import {
  PlanListResponseDto,
  PlanResponseDto,
  toPlanResponse,
} from './dto/plan-response.dto';

@Controller('plan')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly ai: AiService,
  ) {}

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

  /**
   * Überschrift für einen Absatz vorschlagen, der keine hat.
   *
   * Antwortet immer mit 200 — auch wenn nichts herauskommt. Ein fehlender
   * Vorschlag ist kein Fehler, und die Funktion ist optional: sie darf den
   * Editor nie mit einer roten Meldung unterbrechen.
   */
  @Post('suggest-title')
  async suggestTitle(
    @Body() dto: SuggestTitleDto,
  ): Promise<SuggestTitleResponseDto> {
    return new SuggestTitleResponseDto(
      await this.ai.suggestSectionTitle(dto.text),
    );
  }

  /** Sagt dem Client, ob Vorschläge überhaupt eingerichtet sind. */
  @Get('ai/status')
  aiStatus(): { available: boolean } {
    return { available: this.ai.available };
  }

  // Muss vor den ':id'-Routen stehen, sonst wird 'reorder' als id interpretiert.
  @Put('reorder')
  reorderPlans(
    @CurrentUserId() userId: string,
    @Body() dto: ReorderPlansDto,
  ): Promise<void> {
    return this.planService.reorder(userId, dto.ids);
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
