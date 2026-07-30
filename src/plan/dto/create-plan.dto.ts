import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MinLength(1)
  title!: string;

  // null/weglassen = eigenständiger Plan; gesetzt = an einen Folder gebunden.
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
