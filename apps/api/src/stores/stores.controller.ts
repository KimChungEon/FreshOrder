import { Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { StoresService } from './stores.service';

@ApiTags('stores')
@ApiBearerAuth()
@Controller('stores')
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '매장 전체 목록 (ADMIN)' })
  list() {
    return this.service.list();
  }

  @Post('invite-code')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '초대 코드 발급 (6자리)' })
  issueInviteCode() {
    return this.service.issueInviteCode();
  }

  @Get(':id')
  @ApiOperation({ summary: '매장 상세 (발주/매출 요약 포함)' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '매장 점주 가입 승인 (user.isApproved → true)' })
  approve(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.approve(id);
  }
}
