import { Category } from '../../drizzle/schema';

export class CategoryResponseDto {
  categories: Category[];
  total: number;

  constructor(categories: Category[]) {
    this.categories = categories;
    this.total = categories.length;
  }
}
