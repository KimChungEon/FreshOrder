import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @Roles(UserRole.STORE_OWNER)
  @ApiOperation({ summary: '결제 요청 (Mock PG, 즉시 COMPLETED)' })
  pay(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.service.pay(user, dto);
  }

  @Get()
  @ApiOperation({ summary: '결제 내역 (점주는 자기 점포만)' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPaymentsDto) {
    return this.service.list(user, query);
  }
}
