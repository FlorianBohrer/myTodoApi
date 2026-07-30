// src/auth/clerk-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorater';
import { IS_CLERK_ONLY_KEY } from './clerk-only.decorator';
import { DEVICE_TOKEN_PREFIX, DeviceTokenService } from './device-token.service';

/** Woher die Identität stammt — manche Routen dürfen nur aus dem Browser kommen. */
export type AuthKind = 'clerk' | 'device';

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; kind: AuthKind; deviceId?: string };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly deviceTokens: DeviceTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Kein Bearer-Token vorhanden');
    }

    const token = authHeader.slice('Bearer '.length);

    // Gerätetoken tragen ein eigenes Präfix, damit hier nicht erst ein
    // JWT-Verify ins Leere laufen muss.
    if (token.startsWith(DEVICE_TOKEN_PREFIX)) {
      const device = await this.deviceTokens.verify(token);

      if (!device) {
        throw new UnauthorizedException('Gerätetoken ungültig oder widerrufen');
      }

      this.assertNotClerkOnly(context);

      request.auth = {
        userId: device.userId,
        kind: 'device',
        deviceId: device.id,
      };
      return true;
    }

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    const parties = this.config
      .get<string>('CLERK_AUTHORIZED_PARTIES')
      ?.split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      const payload = await verifyToken(token, {
        secretKey,
        authorizedParties: parties && parties.length > 0 ? parties : undefined,
      });

      request.auth = { userId: payload.sub, kind: 'clerk' };
      return true;
    } catch {
      throw new UnauthorizedException('Token ungültig oder abgelaufen');
    }
  }

  /**
   * Sperrt Routen, die eine echte Browser-Sitzung verlangen. Wichtig für die
   * Kopplung: sonst könnte ein abhandengekommenes Gerätetoken sich beliebig
   * viele weitere Geräte nachziehen.
   */
  private assertNotClerkOnly(context: ExecutionContext): void {
    const clerkOnly = this.reflector.getAllAndOverride<boolean>(
      IS_CLERK_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (clerkOnly) {
      throw new ForbiddenException(
        'Diese Aktion ist nur mit einer angemeldeten Browser-Sitzung möglich',
      );
    }
  }
}
