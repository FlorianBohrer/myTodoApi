import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Sprachen, zwischen denen übersetzt wird. */
export const TRANSLATE_TARGETS = ['de', 'en'] as const;
export type TranslateTarget = (typeof TRANSLATE_TARGETS)[number];

/**
 * Was ein Text ist. Fließtext wird ganz übersetzt; bei einem Mermaid-Diagramm
 * nur die Beschriftungen — Schlüsselwörter, Kennungen und Pfeile müssen
 * bleiben, sonst zeichnet es nicht mehr.
 */
export const TRANSLATE_KINDS = ['text', 'mermaid'] as const;
export type TranslateKind = (typeof TRANSLATE_KINDS)[number];

/** Obergrenzen je Anfrage. Der Client teilt größere Dokumente auf. */
export const MAX_TRANSLATE_ITEMS = 200;
export const MAX_TRANSLATE_CHARS = 12000;

export class TranslateItemDto {
  @IsString()
  @MaxLength(MAX_TRANSLATE_CHARS)
  text!: string;

  @IsIn(TRANSLATE_KINDS)
  kind!: TranslateKind;
}

export class TranslateDto {
  @IsIn(TRANSLATE_TARGETS)
  target!: TranslateTarget;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_TRANSLATE_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => TranslateItemDto)
  items!: TranslateItemDto[];
}

/** Was der Dienst zurückgibt: die Übersetzungen in derselben Reihenfolge, oder keine samt Grund. */
export interface TranslationResult {
  translations: string[] | null;
  error?: string;
}

export class TranslateResponseDto {
  translations: string[] | null;
  error?: string;

  constructor(result: TranslationResult) {
    this.translations = result.translations;
    this.error = result.error;
  }
}
