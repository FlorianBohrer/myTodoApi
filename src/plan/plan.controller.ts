import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { AiService } from '../ai/ai.service';
import { AiQuotaService } from '../ai/ai-quota.service';
import { CurrentUserId } from '../auth/current-user.decorator';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ReorderPlansDto } from './dto/reorder-plans.dto';
import {
  AiStatusDto,
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
    private readonly quota: AiQuotaService,
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
    @CurrentUserId() userId: string,
    @Body() dto: SuggestTitleDto,
  ): Promise<SuggestTitleResponseDto> {
    // Erst abbuchen, dann fragen. Andersherum wäre ein Fehlschlag beim Modell
    // gratis — und damit ein Weg, den Deckel zu umgehen.
    if (!(await this.quota.consume(userId))) {
      throw new HttpException(
        'Daily limit for title suggestions reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return new SuggestTitleResponseDto(
      await this.ai.suggestSectionTitle(dto.text),
    );
  }

  /**
   * Sagt dem Client, ob Vorschläge eingerichtet sind und wie viele heute noch
   * übrig sind. So kann er die Funktion ausblenden, statt sie anzubieten und
   * dann abzulehnen.
   */
  @Get('ai/status')
  async aiStatus(@CurrentUserId() userId: string): Promise<AiStatusDto> {
    const quota = await this.quota.state(userId);

    // Kein lesbares Kontingent heisst: die Funktion ist nicht benutzbar. Das
    // dem Client zu sagen ist richtiger, als ihm einen Fehler zu schicken —
    // er blendet sie dann aus, statt bei jedem Absatz zu scheitern.
    if (!quota) {
      return { available: false, remaining: 0, limit: 0, reason: 'storage' };
    }

    if (!this.ai.available) {
      return { available: false, remaining: quota.remaining, limit: quota.limit, reason: 'no-key' };
    }

    return {
      available: true,
      remaining: quota.remaining,
      limit: quota.limit,
      reason: 'ok',
    };
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
