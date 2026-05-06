import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductRequestsController } from './product-requests.controller';
import { ProductRequestsService } from './product-requests.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [CategoriesController, ProductsController, ProductRequestsController],
  providers: [CategoriesService, ProductsService, ProductRequestsService],
})
export class ProductsModule {}
