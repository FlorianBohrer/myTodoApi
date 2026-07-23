import { IsArray, IsUUID } from 'class-validator';

export class SetCategoriesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds!: string[];
}
