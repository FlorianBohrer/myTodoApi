import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './todo/todo.module';
import { CategoryModule } from './category/category.module';
import { PlanModule } from './plan/plan.module';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';
import { AuthModule } from './auth/auth.module';
import { DeviceModule } from './device/device.module';
import { FocusSessionModule } from './focus-session/focus-session.module';
import { DrizzleModule } from './drizzle/drizzle.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    AuthModule,
    TodoModule,
    CategoryModule,
    PlanModule,
    DeviceModule,
    FocusSessionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
  ],
})
export class AppModule {}
