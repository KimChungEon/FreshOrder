import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.store.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, isApproved: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true, isApproved: true },
        },
      },
    });
    if (!store) throw new NotFoundException('매장을 찾을 수 없습니다');

    const [orderCount, totalSales, recentOrders] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { storeId: id } }),
      this.prisma.order.aggregate({
        where: {
          storeId: id,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.SETTLED] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { storeId: id },
        orderBy: { requestedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          requestedAt: true,
        },
      }),
    ]);

    return {
      ...store,
      summary: {
        orderCount,
        totalSales: totalSales._sum.totalAmount ?? 0,
        recentOrders,
      },
    };
  }

  async approve(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!store) throw new NotFoundException('매장을 찾을 수 없습니다');

    return this.prisma.user.update({
      where: { id: store.ownerId },
      data: { isApproved: true },
      select: { id: true, email: true, name: true, isApproved: true, role: true },
    });
  }

  async issueInviteCode() {
    const code = this.generateCode(6);
    // 가장 최근 ADMIN 한 명의 inviteCode 필드를 갱신해 보관
    const admin = await this.prisma.user.findFirst({
      where: { role: UserRole.ADMIN, isApproved: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (admin) {
      await this.prisma.user.update({
        where: { id: admin.id },
        data: { inviteCode: code },
      });
    }
    return { code };
  }

  private generateCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}
