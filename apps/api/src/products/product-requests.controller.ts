import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateProductRequestDto,
  UpdateProductRequestStatusDto,
} from './dto/product-request.dto';
import { ProductRequestsService } from './product-requests.service';

@ApiTags('product-requests')
@ApiBearerAuth()
@Controller('product-requests')
export class ProductRequestsController {
  constructor(private readonly service: ProductRequestsService) {}

  @Post()
  @Roles(UserRole.STORE_OWNER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductRequestDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductRequestStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
