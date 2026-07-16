import { IsBoolean } from 'class-validator';

export class SetCategoryFavoriteDto {
  @IsBoolean()
  favorite!: boolean;
}