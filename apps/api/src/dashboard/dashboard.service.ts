import { ForbiddenException, Injectable } from '@nestjs/common';
import { OrderStatus, SettlementStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async store(user: AuthenticatedUser) {
    if (user.role !== UserRole.STORE_OWNER || !user.storeId) {
      throw new ForbiddenException('직영점주 전용 대시보드입니다');
    }
    const storeId = user.storeId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const inProgressStatuses: OrderStatus[] = [
      OrderStatus.REQUESTED,
      OrderStatus.ACCEPTED,
      OrderStatus.APPROVED,
      OrderStatus.SHIPPING,
    ];

    const [
      inProgressCount,
      monthlyDeliveredCount,
      inventories,
      unpaidAgg,
      recentOrders,
    ] = await this.prisma.$transaction([
      this.prisma.order.count({
        where: { storeId, status: { in: inProgressStatuses } },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.SETTLED] },
          requestedAt: { gte: startOfMonth, lt: endOfMonth },
        },
      }),
      this.prisma.inventory.findMany({
        where: { storeId },
        include: {
          product: {
            select: { id: true, name: true, unit: true, unitPrice: true, imageUrl: true },
          },
        },
      }),
      this.prisma.settlement.aggregate({
        where: {
          storeId,
          status: { in: [SettlementStatus.PENDING, SettlementStatus.PARTIAL] },
        },
        _sum: { unpaidAmount: true },
      }),
      this.prisma.order.findMany({
        where: { storeId },
        orderBy: { requestedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          requestedAt: true,
        },
      }),
    ]);

    const shortageItems = inventories
      .filter((inv) => inv.currentQty < inv.minQty)
      .sort((a, b) => a.currentQty - a.minQty - (b.currentQty - b.minQty))
      .slice(0, 3);

    return {
      inProgressOrders: inProgressCount,
      monthlyDeliveredOrders: monthlyDeliveredCount,
      shortageCount: inventories.filter((inv) => inv.currentQty < inv.minQty).length,
      unpaidAmount: unpaidAgg._sum.unpaidAmount ?? 0,
      recentOrders,
      topShortages: shortageItems,
    };
  }

  async admin() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      todayNew,
      pending,
      shipping,
      monthlyAgg,
      pendingTop,
      stores,
    ] = await this.prisma.$transaction([
      this.prisma.order.count({
        where: { requestedAt: { gte: startOfDay, lt: endOfDay } },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.REQUESTED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPING } }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [OrderStatus.DELIVERED, OrderStatus.SETTLED] },
          requestedAt: { gte: startOfMonth, lt: endOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.REQUESTED },
        orderBy: { requestedAt: 'asc' },
        take: 5,
        include: {
          store: { select: { id: true, storeName: true } },
        },
      }),
      this.prisma.store.findMany({
        select: {
          id: true,
          storeName: true,
          status: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      todayNewOrders: todayNew,
      pendingOrders: pending,
      shippingOrders: shipping,
      monthlySales: monthlyAgg._sum.totalAmount ?? 0,
      pendingTop,
      stores,
    };
  }
}
