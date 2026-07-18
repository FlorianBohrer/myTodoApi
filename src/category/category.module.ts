import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CATEGORY_REPOSITORY } from './category-repository';
import { DrizzleCategoryRepository } from './drizzle-category.repository';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: DrizzleCategoryRepository,
    },
  ],
})
export class CategoryModule {}
