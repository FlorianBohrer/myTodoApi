// src/focus-session/focus-session.module.ts
import { Module } from '@nestjs/common';

import { TodoModule } from '../todo/todo.module';
import { FocusSessionController } from './focus-session.controller';
import { FocusSessionService } from './focus-session.service';
import { FOCUS_SESSION_REPOSITORY } from './focus-session-repository';
import { DrizzleFocusSessionRepository } from './drizzle-focus-session.repository';

@Module({
  // wegen TODO_REPOSITORY: Blöcke halten die Timer-Felder am Todo aktuell.
  imports: [TodoModule],
  controllers: [FocusSessionController],
  providers: [
    FocusSessionService,
    {
      provide: FOCUS_SESSION_REPOSITORY,
      useClass: DrizzleFocusSessionRepository,
    },
  ],
})
export class FocusSessionModule {}
