// src/device/device.module.ts
import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller';

// DeviceTokenService kommt aus dem globalen AuthModule.
@Module({
  controllers: [DeviceController],
})
export class DeviceModule {}
