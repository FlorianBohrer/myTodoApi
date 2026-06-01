import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './public.decorater';
import { verify } from 'crypto';
import type { Request } from 'express';
import { verifyToken } from '@clerk/backend';

export interface AuthenticatedRequest extends Request {
    auth?: { userId: string };
}

@Injectable()
    export class ClerkAuthGuard implements CanActivate {
        constructor (
            private readonly reflector: Reflector,
            private readonly config: ConfigService,
        ){}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY,[
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const authHeader = request.headers.authorization;

        if(!authHeader?.startsWith('Bearer')){
            throw new UnauthorizedException('kein Bearer-Token vorhanden');
        }
        const token = authHeader.slice('Bearer'.length);
        
        try {
            const payload = await verifyToken(token, {
                secretKey: this.config.get<string>('CLERK_SECRET_KEY'),
                authorizedParties: this.config
                .get<string>('CLERK_AUTHORIZED_PARTIES')
                ?.split(','),
            });

            request.auth = { userId: payload.sub };
            return true;
        }catch{
            throw new UnauthorizedException('Token ungültig oder abgelaufen');

        
         }
        }  
    }
