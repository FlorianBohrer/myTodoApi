import { CategoryItemResponseDto } from './category-item-response.dto';

export class CategoryResponseDto {
  readonly categories: CategoryItemResponseDto[];
  readonly total: number;

  constructor(categories: CategoryItemResponseDto[]) {
    this.categories = categories;
    this.total = categories.length;
  }
}
