import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('store')
  @Roles(UserRole.STORE_OWNER)
  @ApiOperation({ summary: '직영점 대시보드 요약' })
  store(@CurrentUser() user: AuthenticatedUser) {
    return this.service.store(user);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '본사 관리자 대시보드 요약' })
  admin() {
    return this.service.admin();
  }
}
