import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  /**
   * Sammlung, in der der Folder in der Übersicht steht.
   *
   * null hebt die Zuordnung auf — deshalb steht hier @IsOptional() und nicht
   * @IsString() allein: @IsOptional() lässt null durch, und genau das braucht
   * es, um eine Zuordnung wieder loszuwerden. Die Obergrenze hält einen
   * Absatz davon ab, als Abschnittsüberschrift in der Übersicht zu landen.
   */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  collection?: string | null;
}
