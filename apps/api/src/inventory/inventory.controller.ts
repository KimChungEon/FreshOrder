import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  BulkUpdateInventoryDto,
  ListInventoryQueryDto,
  UpdateInventoryDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('stores/:storeId/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @ApiOperation({ summary: '재고 현황 (status 자동 계산)' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Query() query: ListInventoryQueryDto,
  ) {
    return this.service.list(user, storeId, query);
  }

  @Put()
  @ApiOperation({ summary: '재고 일괄 수정 (STORE_OWNER)' })
  bulkUpsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() dto: BulkUpdateInventoryDto,
  ) {
    return this.service.bulkUpsert(user, storeId, dto);
  }

  @Get('shortage')
  @ApiOperation({ summary: '부족 품목 + 추천 발주량/금액' })
  shortage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return this.service.shortage(user, storeId);
  }

  @Patch(':productId')
  @ApiOperation({ summary: '품목별 재고 수정 (STORE_OWNER)' })
  updateOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.service.updateOne(user, storeId, productId, dto);
  }
}
