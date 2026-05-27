import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser, storeId: string) {
    this.assertStoreAccess(user, storeId);
    return this.prisma.favorite.findMany({
      where: { storeId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitPrice: true,
            imageUrl: true,
            isActive: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: AuthenticatedUser, storeId: string, dto: CreateFavoriteDto) {
    this.assertStoreAccess(user, storeId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('품목을 찾을 수 없습니다');

    try {
      return await this.prisma.favorite.create({
        data: { storeId, productId: dto.productId },
        include: {
          product: { select: { id: true, name: true, unit: true, unitPrice: true } },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('이미 즐겨찾기에 추가된 품목입니다');
      }
      throw e;
    }
  }

  async remove(user: AuthenticatedUser, storeId: string, productId: string) {
    this.assertStoreAccess(user, storeId);
    const found = await this.prisma.favorite.findUnique({
      where: { storeId_productId: { storeId, productId } },
    });
    if (!found) throw new NotFoundException('즐겨찾기 항목이 없습니다');
    await this.prisma.favorite.delete({
      where: { storeId_productId: { storeId, productId } },
    });
    return { ok: true };
  }

  private assertStoreAccess(user: AuthenticatedUser, storeId: string) {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.STORE_OWNER && user.storeId === storeId) return;
    throw new ForbiddenException('해당 매장에 접근할 수 없습니다');
  }
}
