import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiQuotaService } from './ai-quota.service';

@Module({
  providers: [AiService, AiQuotaService],
  exports: [AiService, AiQuotaService],
})
export class AiModule {}
