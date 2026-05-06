import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto, ListProductsDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.softDelete(id);
  }
}
