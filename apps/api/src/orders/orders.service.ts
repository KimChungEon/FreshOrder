import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ───────────── 발주 생성 ─────────────
  async create(user: AuthenticatedUser, dto: CreateOrderDto) {
    if (user.role !== UserRole.STORE_OWNER || !user.storeId) {
      throw new ForbiddenException('직영점주만 발주할 수 있습니다');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, unitPrice: true, name: true, minOrderQty: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('존재하지 않거나 비활성 품목이 포함되어 있습니다');
    }
    const priceMap = new Map(products.map((p) => [p.id, p]));

    const items = dto.items.map((i) => {
      const p = priceMap.get(i.productId)!;
      if (i.quantity < p.minOrderQty) {
        throw new BadRequestException(`${p.name}의 최소 발주 수량은 ${p.minOrderQty}입니다`);
      }
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: p.unitPrice,
        subtotal: p.unitPrice * i.quantity,
      };
    });
    const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);
    const orderNumber = await this.nextOrderNumber();

    const created = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          storeId: user.storeId!,
          orderNumber,
          totalAmount,
          paymentType: dto.paymentType,
          orderItems: { create: items },
        },
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, unit: true } } } },
        },
      });
    });

    // 본사 관리자에게 알림 (DB 저장만)
    await this.notifications.notifyAdmins({
      title: '신규 발주 요청',
      message: `발주번호 ${created.orderNumber} (총 ${created.totalAmount.toLocaleString()}원)`,
      linkUrl: `/admin/orders/${created.id}`,
    });

    return created;
  }

  // ───────────── 목록 조회 ─────────────
  async list(user: AuthenticatedUser, query: ListOrdersDto) {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.requestedAt = {};
      if (query.from) (where.requestedAt as Prisma.DateTimeFilter).gte = query.from;
      if (query.to) (where.requestedAt as Prisma.DateTimeFilter).lte = query.to;
    }

    if (user.role === UserRole.STORE_OWNER) {
      where.storeId = user.storeId ?? '__none__';
    } else if (query.storeId) {
      where.storeId = query.storeId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          store: { select: { id: true, storeName: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  }

  // ───────────── 단건 조회 ─────────────
  async findOne(user: AuthenticatedUser, id: string) {
    const found = await this.prisma.order.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, storeName: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, unit: true } } },
        },
        payment: true,
      },
    });
    if (!found) throw new NotFoundException('발주를 찾을 수 없습니다');
    if (user.role === UserRole.STORE_OWNER && found.storeId !== user.storeId) {
      throw new ForbiddenException('해당 발주에 접근할 수 없습니다');
    }
    return found;
  }

  // ───────────── 상태 전이 (관리자) ─────────────
  approve(id: string) {
    return this.transition(id, [OrderStatus.REQUESTED], OrderStatus.APPROVED, {
      approvedAt: new Date(),
    });
  }

  reject(id: string, reason: string) {
    return this.transition(id, [OrderStatus.REQUESTED], OrderStatus.REJECTED, {
      rejectReason: reason,
    });
  }

  ship(id: string) {
    return this.transition(id, [OrderStatus.APPROVED], OrderStatus.SHIPPING);
  }

  deliver(id: string) {
    return this.transition(id, [OrderStatus.SHIPPING], OrderStatus.DELIVERED, {
      deliveredAt: new Date(),
    });
  }

  // ───────────── 반려 발주 재요청 (점주) ─────────────
  async resubmit(user: AuthenticatedUser, id: string, dto: CreateOrderDto) {
    if (user.role !== UserRole.STORE_OWNER || !user.storeId) {
      throw new ForbiddenException('직영점주만 재요청할 수 있습니다');
    }
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('발주를 찾을 수 없습니다');
    if (order.storeId !== user.storeId) {
      throw new ForbiddenException('해당 발주에 접근할 수 없습니다');
    }
    if (order.status !== OrderStatus.REJECTED) {
      throw new BadRequestException(
        `현재 상태(${order.status})에서는 이 작업을 수행할 수 없습니다`,
      );
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, unitPrice: true, name: true, minOrderQty: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('존재하지 않거나 비활성 품목이 포함되어 있습니다');
    }
    const priceMap = new Map(products.map((p) => [p.id, p]));
    const items = dto.items.map((i) => {
      const p = priceMap.get(i.productId)!;
      if (i.quantity < p.minOrderQty) {
        throw new BadRequestException(`${p.name}의 최소 발주 수량은 ${p.minOrderQty}입니다`);
      }
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: p.unitPrice,
        subtotal: p.unitPrice * i.quantity,
      };
    });
    const totalAmount = items.reduce((s, it) => s + it.subtotal, 0);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      return tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.REQUESTED,
          rejectReason: null,
          totalAmount,
          paymentType: dto.paymentType,
          requestedAt: new Date(),
          approvedAt: null,
          deliveredAt: null,
          orderItems: { create: items },
        },
        include: { orderItems: true },
      });
    });

    await this.notifications.notifyAdmins({
      title: '발주 재요청',
      message: `발주번호 ${updated.orderNumber} 재요청`,
      linkUrl: `/admin/orders/${updated.id}`,
    });

    return updated;
  }

  // ───────────── 내부 헬퍼 ─────────────
  private async transition(
    id: string,
    allowed: OrderStatus[],
    next: OrderStatus,
    extraData: Prisma.OrderUpdateInput = {},
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('발주를 찾을 수 없습니다');
    if (!allowed.includes(order.status)) {
      throw new BadRequestException(
        `현재 상태(${order.status})에서는 이 작업을 수행할 수 없습니다`,
      );
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: next, ...extraData },
    });
  }

  private async nextOrderNumber(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const start = new Date(yyyy, now.getMonth(), now.getDate());
    const end = new Date(yyyy, now.getMonth(), now.getDate() + 1);
    const todayCount = await this.prisma.order.count({
      where: { requestedAt: { gte: start, lt: end } },
    });
    const seq = String(todayCount + 1).padStart(3, '0');
    return `${yyyy}-${mm}${dd}-${seq}`;
  }
}
