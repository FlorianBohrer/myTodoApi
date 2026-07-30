// src/focus-session/focus-session.controller.ts
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/current-user.decorator';
import { FocusSessionService } from './focus-session.service';
import { StartFocusSessionDto } from './dto/start-focus-session.dto';
import { StopFocusSessionDto } from './dto/stop-focus-session.dto';
import {
  ActiveFocusSessionResponseDto,
  FocusSessionResponseDto,
} from './dto/focus-session-response.dto';
import { FocusStatsResponseDto } from './dto/focus-stats-response.dto';
import { toFocusSessionResponse } from './focus-session.mapper';

@Controller('focus-session')
export class FocusSessionController {
  constructor(private readonly focusSessions: FocusSessionService) {}

  /**
   * Der laufende Block, oder null. Einzige Quelle der Wahrheit für den Client:
   * nach Neustart, Ruhezustand oder Gerätewechsel fragt er hier nach.
   */
  @Get('active')
  async getActive(
    @CurrentUserId() userId: string,
  ): Promise<ActiveFocusSessionResponseDto> {
    const session = await this.focusSessions.findActive(userId);
    const now = new Date();

    return new ActiveFocusSessionResponseDto(
      session ? toFocusSessionResponse(session, now) : null,
      now,
    );
  }

  // Muss vor ':id' stehen, sonst wird 'stats' als id gelesen.
  @Get('stats')
  getStats(
    @CurrentUserId() userId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    @Query('tzOffsetMinutes', new DefaultValuePipe(0), ParseIntPipe)
    tzOffsetMinutes: number,
  ): Promise<FocusStatsResponseDto> {
    // Grenzen festzurren: days steuert eine Schleife, tzOffset eine Rechnung.
    const safeDays = Math.min(Math.max(days, 1), 90);
    const safeOffset = Math.min(Math.max(tzOffsetMinutes, -840), 840);

    return this.focusSessions.stats(userId, safeDays, safeOffset);
  }

  @Get()
  async getRecent(
    @CurrentUserId() userId: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ): Promise<FocusSessionResponseDto[]> {
    const sessions = await this.focusSessions.findRecent(
      userId,
      Math.min(Math.max(limit, 1), 200),
    );
    const now = new Date();

    return sessions.map((session) => toFocusSessionResponse(session, now));
  }

  @Post()
  async start(
    @CurrentUserId() userId: string,
    @Body() startFocusSessionDto: StartFocusSessionDto,
  ): Promise<FocusSessionResponseDto> {
    const session = await this.focusSessions.start(
      userId,
      startFocusSessionDto.todoId,
      startFocusSessionDto.plannedSeconds,
    );

    return toFocusSessionResponse(session, new Date());
  }

  @Post(':id/pause')
  async pause(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<FocusSessionResponseDto> {
    const session = await this.focusSessions.pause(userId, id);

    return toFocusSessionResponse(session, new Date());
  }

  @Post(':id/resume')
  async resume(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<FocusSessionResponseDto> {
    const session = await this.focusSessions.resume(userId, id);

    return toFocusSessionResponse(session, new Date());
  }

  @Post(':id/stop')
  async stop(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() stopFocusSessionDto: StopFocusSessionDto,
  ): Promise<FocusSessionResponseDto> {
    const session = await this.focusSessions.stop(
      userId,
      id,
      stopFocusSessionDto.completed,
    );

    return toFocusSessionResponse(session, new Date());
  }
}
