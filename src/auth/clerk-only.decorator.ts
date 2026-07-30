// src/auth/clerk-only.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_CLERK_ONLY_KEY = 'isClerkOnly';

/**
 * Markiert Routen, die ausschließlich mit einer Clerk-Browser-Sitzung erreichbar
 * sind — Gerätetoken werden abgelehnt. Für alles, was neue Zugänge erzeugt oder
 * bestehende verwaltet.
 */
export const ClerkOnly = () => SetMetadata(IS_CLERK_ONLY_KEY, true);
