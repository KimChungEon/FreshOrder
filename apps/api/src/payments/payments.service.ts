import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async pay(user: AuthenticatedUser, dto: CreatePaymentDto) {
    if (user.role !== UserRole.STORE_OWNER || !user.storeId) {
      throw new ForbiddenException('직영점주만 결제할 수 있습니다');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('발주를 찾을 수 없습니다');
    if (order.storeId !== user.storeId) {
      throw new ForbiddenException('해당 발주에 접근할 수 없습니다');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `배송완료(DELIVERED) 상태에서만 결제 가능합니다 (현재: ${order.status})`,
      );
    }
    if (order.payment) {
      throw new ConflictException('이미 결제 처리된 발주입니다');
    }

    const pgTransactionId = `MOCK-${randomUUID()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          storeId: order.storeId,
          amount: order.totalAmount,
          method: dto.method,
          status: PaymentStatus.COMPLETED,
          pgTransactionId,
          paidAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.SETTLED },
      });
      return payment;
    });

    return result;
  }

  async list(user: AuthenticatedUser, query: ListPaymentsDto) {
    const where: Prisma.PaymentWhereInput = {};
    if (query.status) where.status = query.status;

    if (user.role === UserRole.STORE_OWNER) {
      where.storeId = user.storeId ?? '__none__';
    } else if (query.storeId) {
      where.storeId = query.storeId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            select: { id: true, orderNumber: true, totalAmount: true, status: true },
          },
          store: { select: { id: true, storeName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, page: query.page, limit: query.limit, total };
  }
}
