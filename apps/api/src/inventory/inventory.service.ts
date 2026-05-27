import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  BulkUpdateInventoryDto,
  InventoryStatus,
  ListInventoryQueryDto,
  UpdateInventoryDto,
} from './dto/inventory.dto';

interface InventoryRow {
  id: string;
  storeId: string;
  productId: string;
  currentQty: number;
  minQty: number;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    minOrderQty: number;
    imageUrl: string | null;
  };
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, storeId: string, query: ListInventoryQueryDto) {
    this.assertStoreAccess(user, storeId);
    const rows = await this.findRows(storeId);
    const items = rows.map((r) => this.attachStatus(r));
    if (query.status) {
      return items.filter((i) => i.status === query.status);
    }
    return items;
  }

  async bulkUpsert(user: AuthenticatedUser, storeId: string, dto: BulkUpdateInventoryDto) {
    this.assertStoreAccess(user, storeId, true);
    await this.assertStoreExists(storeId);

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('존재하지 않는 품목이 포함되어 있습니다');
    }

    await this.prisma.$transaction(
      dto.items.map((it) =>
        this.prisma.inventory.upsert({
          where: { storeId_productId: { storeId, productId: it.productId } },
          create: {
            storeId,
            productId: it.productId,
            currentQty: it.currentQty,
            minQty: it.minQty ?? 0,
          },
          update: {
            currentQty: it.currentQty,
            ...(it.minQty !== undefined ? { minQty: it.minQty } : {}),
          },
        }),
      ),
    );

    const rows = await this.findRows(storeId);
    return rows.map((r) => this.attachStatus(r));
  }

  async updateOne(
    user: AuthenticatedUser,
    storeId: string,
    productId: string,
    dto: UpdateInventoryDto,
  ) {
    this.assertStoreAccess(user, storeId, true);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('품목을 찾을 수 없습니다');

    const updated = await this.prisma.inventory.upsert({
      where: { storeId_productId: { storeId, productId } },
      create: {
        storeId,
        productId,
        currentQty: dto.currentQty,
        minQty: dto.minQty ?? 0,
      },
      update: {
        currentQty: dto.currentQty,
        ...(dto.minQty !== undefined ? { minQty: dto.minQty } : {}),
      },
      include: {
        product: {
          select: { id: true, name: true, unit: true, unitPrice: true, minOrderQty: true, imageUrl: true },
        },
      },
    });
    return this.attachStatus(updated);
  }

  async shortage(user: AuthenticatedUser, storeId: string) {
    this.assertStoreAccess(user, storeId);
    const rows = await this.findRows(storeId);
    const shortageItems = rows
      .map((r) => this.attachStatus(r))
      .filter(
        (it) =>
          it.status === InventoryStatus.EMPTY || it.status === InventoryStatus.SHORTAGE,
      )
      .map((it) => {
        const recommendedQty = Math.max(it.minQty - it.currentQty, it.product.minOrderQty);
        const recommendedAmount = recommendedQty * it.product.unitPrice;
        return { ...it, recommendedQty, recommendedAmount };
      });

    const totalRecommendedQty = shortageItems.reduce((s, it) => s + it.recommendedQty, 0);
    const totalRecommendedAmount = shortageItems.reduce((s, it) => s + it.recommendedAmount, 0);

    return {
      items: shortageItems,
      summary: {
        count: shortageItems.length,
        totalRecommendedQty,
        totalRecommendedAmount,
      },
    };
  }

  // ───────────── 내부 ─────────────
  private assertStoreAccess(
    user: AuthenticatedUser,
    storeId: string,
    writeOnly: boolean = false,
  ) {
    if (user.role === UserRole.ADMIN) {
      if (writeOnly) {
        throw new ForbiddenException('재고 수정은 직영점주 권한입니다');
      }
      return;
    }
    if (user.role === UserRole.STORE_OWNER && user.storeId === storeId) return;
    throw new ForbiddenException('해당 매장 재고에 접근할 수 없습니다');
  }

  private async assertStoreExists(storeId: string) {
    const exists = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!exists) throw new NotFoundException('매장을 찾을 수 없습니다');
  }

  private findRows(storeId: string): Promise<InventoryRow[]> {
    return this.prisma.inventory.findMany({
      where: { storeId },
      include: {
        product: {
          select: { id: true, name: true, unit: true, unitPrice: true, minOrderQty: true, imageUrl: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private attachStatus(row: InventoryRow) {
    return { ...row, status: this.computeStatus(row.currentQty, row.minQty) };
  }

  private computeStatus(currentQty: number, minQty: number): InventoryStatus {
    if (currentQty <= 0) return InventoryStatus.EMPTY;
    if (currentQty < minQty) return InventoryStatus.SHORTAGE;
    if (currentQty < minQty * 1.5) return InventoryStatus.WARNING;
    return InventoryStatus.SUFFICIENT;
  }
}
