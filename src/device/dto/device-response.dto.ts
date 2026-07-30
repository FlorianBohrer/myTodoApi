import type { DeviceToken } from '../../drizzle/schema';

export class DeviceResponseDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly lastUsedAt: Date | null,
  ) {}
}

export class PairingCodeResponseDto {
  constructor(
    public readonly code: string,
    public readonly expiresAt: Date,
  ) {}
}

export class PairedDeviceResponseDto {
  constructor(
    /** Einziger Zeitpunkt, an dem das Klartext-Token die API verlässt. */
    public readonly token: string,
    public readonly device: DeviceResponseDto,
  ) {}
}

export function toDeviceResponse(device: DeviceToken): DeviceResponseDto {
  return new DeviceResponseDto(
    device.id,
    device.name,
    device.createdAt,
    device.lastUsedAt,
  );
}
