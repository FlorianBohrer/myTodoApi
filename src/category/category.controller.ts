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
import type { Category } from '../drizzle/schema';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { SetCategoryFavoriteDto } from './dto/set-category-favorite.dto';
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories(
    @CurrentUserId() userId: string,
  ): Promise<CategoryResponseDto> {
    const items = await this.categoryService.findAll(userId);
    return new CategoryResponseDto(items);
  }

  @Post()
  createCategory(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.createCategory(userId, dto);
  }

  @Put(':id')
  updateCategory(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.updateCategory(userId, id, dto);
  }

  @Delete(':id')
  deleteCategory(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.categoryService.deleteCategory(userId, id);
  }

  @Patch(':id/favorite')
setFavorite(
  @CurrentUserId() userId: string,
  @Param('id') id: string,
  @Body() dto: SetCategoryFavoriteDto,
): Promise<Category> {
  return this.categoryService.setFavorite(
    userId,
    id,
    dto.favorite,
  );
}
}
