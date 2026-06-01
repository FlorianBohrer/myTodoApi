import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

import { 
    createParamDecorator, 
    ExecutionContext,
    UnauthorizedException,

 } from '@nestjs/common';

 import type { AuthenticatedRequest } from './clerk-auth-guard';

 export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException("kein authentifizierter Benutzer gefunden");
    }
    return userId;
  },
);