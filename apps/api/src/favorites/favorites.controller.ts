import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFavoriteDto } from './dto/favorite.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('stores/:storeId/favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return this.service.list(user, storeId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() dto: CreateFavoriteDto,
  ) {
    return this.service.create(user, storeId, dto);
  }

  @Delete(':productId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.service.remove(user, storeId, productId);
  }
}
