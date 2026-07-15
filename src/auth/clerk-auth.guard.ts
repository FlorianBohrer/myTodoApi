// src/auth/clerk-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorater';

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
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

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    const parties = this.config
      .get<string>('CLERK_AUTHORIZED_PARTIES')
      ?.split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // DEBUG: zeigt, womit verifiziert wird (Key wird maskiert).
    console.log('[guard] secretKey vorhanden?', !!secretKey, '| prefix:', secretKey?.slice(0, 8));
    console.log('[guard] authorizedParties:', parties);

    try {
      const payload = await verifyToken(token, {
        secretKey,
        authorizedParties: parties && parties.length > 0 ? parties : undefined,
      });

      request.auth = { userId: payload.sub };
      return true;
    } catch (err) {
      // DEBUG: echter Grund im Terminal
      console.error('[guard] verifyToken FEHLER:', (err as Error).message);
      throw new UnauthorizedException('Token ungültig oder abgelaufen');
    }
  }
}
