import type { Category } from '../../drizzle/schema';
import { CategoryItemResponseDto } from './category-item-response.dto';

export function toCategoryItemResponse(
  category: Category,
): CategoryItemResponseDto {
  return new CategoryItemResponseDto(
    category.id,
    category.name,
    category.color,
    category.icon,
    category.favoritePosition,
  );
}