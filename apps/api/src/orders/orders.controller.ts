import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { RejectOrderDto } from './dto/reject-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  @Roles(UserRole.STORE_OWNER)
  @ApiOperation({ summary: '발주 생성 (직영점주)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: '발주 목록 (점주는 자기 매장만)' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListOrdersDto) {
    return this.service.list(user, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.findOne(user, id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RejectOrderDto) {
    return this.service.reject(id, dto.rejectReason);
  }

  @Patch(':id/ship')
  @Roles(UserRole.ADMIN)
  ship(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.ship(id);
  }

  @Patch(':id/deliver')
  deliver(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.deliver(id);
  }

  @Put(':id')
  @Roles(UserRole.STORE_OWNER)
  @ApiOperation({ summary: '반려된 발주 수정 후 재요청' })
  resubmit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.service.resubmit(user, id, dto);
  }
}
