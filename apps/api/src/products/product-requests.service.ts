import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductRequestDto,
  UpdateProductRequestStatusDto,
} from './dto/product-request.dto';

@Injectable()
export class ProductRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthenticatedUser, dto: CreateProductRequestDto) {
    if (!user.storeId) {
      throw new ForbiddenException('연결된 매장이 없습니다');
    }
    return this.prisma.productRequest.create({
      data: {
        storeId: user.storeId,
        productName: dto.productName,
        description: dto.description,
      },
    });
  }

  list(user: AuthenticatedUser) {
    const where: Prisma.ProductRequestWhereInput =
      user.role === UserRole.ADMIN ? {} : { storeId: user.storeId ?? '__none__' };
    return this.prisma.productRequest.findMany({
      where,
      include: { store: { select: { id: true, storeName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateProductRequestStatusDto) {
    const found = await this.prisma.productRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('요청을 찾을 수 없습니다');
    return this.prisma.productRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
