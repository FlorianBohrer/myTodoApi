// src/auth/auth.module.ts
import { Global, Module } from '@nestjs/common';
import { DeviceTokenService } from './device-token.service';

/**
 * Global, weil der APP_GUARD aus dem AppModule den DeviceTokenService braucht
 * und das DeviceModule denselben Service für Kopplung und Verwaltung nutzt.
 */
@Global()
@Module({
  providers: [DeviceTokenService],
  exports: [DeviceTokenService],
})
export class AuthModule {}
