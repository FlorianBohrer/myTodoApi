// src/device/device.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/current-user.decorator';
import { ClerkOnly } from '../auth/clerk-only.decorator';
import { Public } from '../auth/public.decorater';
import { DeviceTokenService } from '../auth/device-token.service';
import { PairDeviceDto } from './dto/pair-device.dto';
import {
  DeviceResponseDto,
  PairedDeviceResponseDto,
  PairingCodeResponseDto,
  toDeviceResponse,
} from './dto/device-response.dto';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceTokens: DeviceTokenService) {}

  /**
   * Erzeugt einen Kopplungscode. Nur aus dem eingeloggten Browser — ein Gerät
   * darf sich keine Nachfolger erzeugen.
   */
  @ClerkOnly()
  @Post('pairing-code')
  async createPairingCode(
    @CurrentUserId() userId: string,
  ): Promise<PairingCodeResponseDto> {
    const { code, expiresAt } =
      await this.deviceTokens.createPairingCode(userId);

    return new PairingCodeResponseDto(code, expiresAt);
  }

  /**
   * Tauscht den Code gegen ein Gerätetoken. Öffentlich, weil das Gerät zu
   * diesem Zeitpunkt naturgemäß noch kein Token hat — der Code ist das Geheimnis.
   */
  @Public()
  @Post('pair')
  async pair(
    @Body() pairDeviceDto: PairDeviceDto,
  ): Promise<PairedDeviceResponseDto> {
    const paired = await this.deviceTokens.redeemPairingCode(
      pairDeviceDto.code,
      pairDeviceDto.deviceName,
    );

    if (!paired) {
      throw new UnauthorizedException(
        'Code ungültig, abgelaufen oder bereits benutzt',
      );
    }

    return new PairedDeviceResponseDto(
      paired.token,
      toDeviceResponse(paired.device),
    );
  }

  @ClerkOnly()
  @Get()
  async listDevices(
    @CurrentUserId() userId: string,
  ): Promise<DeviceResponseDto[]> {
    const devices = await this.deviceTokens.listDevices(userId);

    return devices.map(toDeviceResponse);
  }

  @ClerkOnly()
  @Delete(':id')
  @HttpCode(204)
  async revokeDevice(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const revoked = await this.deviceTokens.revokeDevice(userId, id);

    if (!revoked) {
      throw new NotFoundException('Gerät nicht gefunden');
    }
  }
}
