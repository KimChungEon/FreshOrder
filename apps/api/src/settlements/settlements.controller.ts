import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  GenerateSettlementDto,
  ListSettlementsDto,
  UpdateSettlementDto,
} from './dto/settlement.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('settlements')
@ApiBearerAuth()
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly service: SettlementsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListSettlementsDto) {
    return this.service.list(user, query);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '월별 정산서 생성 (해당 월 DELIVERED/SETTLED 합산)' })
  generate(@Body() dto: GenerateSettlementDto) {
    return this.service.generate(dto);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: '정산서 PDF (현재는 JSON 반환)' })
  getPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getPdf(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '정산 상태/입금액 변경' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSettlementDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
