import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  // Geordnete Blöcke (Text/Tabelle …) als freies JSON-Array.
  @IsOptional()
  @IsArray()
  content?: unknown[];
}
