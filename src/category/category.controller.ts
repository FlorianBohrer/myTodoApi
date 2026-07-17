import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { SetCategoryFavoriteDto } from './dto/set-category-favorite.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { toCategoryItemResponse } from './dto/category.mapper';
import { CategoryItemResponseDto } from './dto/category-item-response.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

 @Get()
async getAllCategories(
  @CurrentUserId() userId: string,
): Promise<CategoryResponseDto> {
  const categories =
    await this.categoryService.findAll(userId);

  return new CategoryResponseDto(
    categories.map(toCategoryItemResponse),
  );
}

@Post()
async createCategory(
  @CurrentUserId() userId: string,
  @Body() dto: CreateCategoryDto,
): Promise<CategoryItemResponseDto> {
  const category =
    await this.categoryService.createCategory(
      userId,
      dto,
    );

  return toCategoryItemResponse(category);
}

// Muss vor den ':id'-Routen stehen, sonst wird 'reorder' als id interpretiert.
@Put('reorder')
reorderCategories(
  @CurrentUserId() userId: string,
  @Body() dto: ReorderCategoriesDto,
): Promise<void> {
  return this.categoryService.reorder(userId, dto.ids);
}

@Put(':id')
async updateCategory(
  @CurrentUserId() userId: string,
  @Param('id') id: string,
  @Body() dto: UpdateCategoryDto,
): Promise<CategoryItemResponseDto> {
  const category =
    await this.categoryService.updateCategory(
      userId,
      id,
      dto,
    );

  return toCategoryItemResponse(category);
}

@Delete(':id')
deleteCategory(
  @CurrentUserId() userId: string,
  @Param('id') id: string,
): Promise<void> {
  return this.categoryService.deleteCategory(
    userId,
    id,
  );
}

 
@Patch(':id/favorite')
async setFavorite(
  @CurrentUserId() userId: string,
  @Param('id') id: string,
  @Body() dto: SetCategoryFavoriteDto,
): Promise<CategoryItemResponseDto> {
  const category =
    await this.categoryService.setFavorite(
      userId,
      id,
      dto.favorite,
    );

  return toCategoryItemResponse(category);
}
}
