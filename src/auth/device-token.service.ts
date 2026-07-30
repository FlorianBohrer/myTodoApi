// src/auth/device-token.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';

import { DRIZZLE } from '../drizzle/drizzle.module';
import type { DrizzleDB } from '../drizzle/drizzle.module';
import { deviceTokens, pairingCodes } from '../drizzle/schema';
import type { DeviceToken } from '../drizzle/schema';

/** Präfix, an dem der Guard ein Gerätetoken von einem Clerk-JWT unterscheidet. */
export const DEVICE_TOKEN_PREFIX = 'tt_';

/** Wie lange ein Kopplungscode gültig ist. Kurz, weil er abgetippt wird. */
const PAIRING_CODE_TTL_MS = 5 * 60 * 1000;

/**
 * Alphabet ohne 0/O/1/I/L — der Code wird vom Bildschirm abgelesen und
 * eingetippt, verwechselbare Zeichen kosten hier nur Nerven.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export interface PairedDevice {
  /** Klartext-Token. Existiert nur hier und in der Antwort an das Gerät. */
  token: string;
  device: DeviceToken;
}

@Injectable()
export class DeviceTokenService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  /**
   * Prüft ein Gerätetoken und gibt den Besitzer zurück. null heißt: unbekannt,
   * widerrufen oder kein Gerätetoken.
   */
  async verify(token: string): Promise<DeviceToken | null> {
    if (!token.startsWith(DEVICE_TOKEN_PREFIX)) return null;

    const [device] = await this.db
      .select()
      .from(deviceTokens)
      .where(
        and(
          eq(deviceTokens.tokenHash, this.hash(token)),
          isNull(deviceTokens.revokedAt),
        ),
      );

    if (!device) return null;

    // lastUsedAt nur grob führen: einmal pro Minute reicht, sonst schreibt jeder
    // Poll-Request in die Datenbank.
    const lastUsed = device.lastUsedAt?.getTime() ?? 0;
    if (Date.now() - lastUsed > 60_000) {
      await this.db
        .update(deviceTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(deviceTokens.id, device.id));
    }

    return device;
  }

  /** Erzeugt einen frischen Kopplungscode für einen eingeloggten Nutzer. */
  async createPairingCode(
    userId: string,
  ): Promise<{ code: string; expiresAt: Date }> {
    // Gelegenheitsputz: abgelaufene und eingelöste Codes des Nutzers wegräumen.
    await this.db
      .delete(pairingCodes)
      .where(
        and(
          eq(pairingCodes.userId, userId),
          or(
            lt(pairingCodes.expiresAt, new Date()),
            isNotNull(pairingCodes.consumedAt),
          ),
        ),
      );

    const code = this.randomCode();
    const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS);

    await this.db.insert(pairingCodes).values({ code, userId, expiresAt });

    return { code, expiresAt };
  }

  /**
   * Löst einen Kopplungscode gegen ein Gerätetoken ein. Der Code ist danach
   * verbraucht, auch wenn dasselbe Gerät es noch einmal versucht.
   */
  async redeemPairingCode(
    code: string,
    deviceName: string,
  ): Promise<PairedDevice | null> {
    const normalized = code.trim().toUpperCase().replace(/[\s-]/g, '');

    // consumedAt in derselben Abfrage setzen: gewinnt genau ein Aufruf, alle
    // weiteren finden nichts mehr vor (kein Zeitfenster für ein zweites Gerät).
    const [claimed] = await this.db
      .update(pairingCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(pairingCodes.code, normalized),
          isNull(pairingCodes.consumedAt),
        ),
      )
      .returning();

    if (!claimed) return null;

    if (claimed.expiresAt.getTime() < Date.now()) return null;

    const token = DEVICE_TOKEN_PREFIX + randomBytes(32).toString('base64url');

    const [device] = await this.db
      .insert(deviceTokens)
      .values({
        userId: claimed.userId,
        name: deviceName.trim() || 'Unbenanntes Gerät',
        tokenHash: this.hash(token),
      })
      .returning();

    return { token, device };
  }

  async listDevices(userId: string): Promise<DeviceToken[]> {
    return this.db
      .select()
      .from(deviceTokens)
      .where(
        and(eq(deviceTokens.userId, userId), isNull(deviceTokens.revokedAt)),
      );
  }

  /** Widerruft ein Gerät. false = gehört dem Nutzer nicht oder ist schon weg. */
  async revokeDevice(userId: string, id: string): Promise<boolean> {
    const [revoked] = await this.db
      .update(deviceTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(deviceTokens.id, id),
          eq(deviceTokens.userId, userId),
          isNull(deviceTokens.revokedAt),
        ),
      )
      .returning();

    return Boolean(revoked);
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private randomCode(): string {
    // rejection sampling: 256 ist kein Vielfaches von 31, ein simples Modulo
    // würde die vorderen Zeichen des Alphabets bevorzugen.
    const max = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
    let out = '';

    while (out.length < CODE_LENGTH) {
      for (const byte of randomBytes(CODE_LENGTH)) {
        if (byte >= max) continue;
        out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
        if (out.length === CODE_LENGTH) break;
      }
    }

    return out;
  }
}
