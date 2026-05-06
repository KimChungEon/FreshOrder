import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, SettlementStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerateSettlementDto,
  ListSettlementsDto,
  UpdateSettlementDto,
} from './dto/settlement.dto';

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser, query: ListSettlementsDto) {
    const where: Prisma.SettlementWhereInput = {};
    if (user.role === UserRole.STORE_OWNER) {
      where.storeId = user.storeId ?? '__none__';
    } else if (query.storeId) {
      where.storeId = query.storeId;
    }
    if (query.year) where.year = query.year;
    if (query.status) where.status = query.status;

    return this.prisma.settlement.findMany({
      where,
      include: { store: { select: { id: true, storeName: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async generate(dto: GenerateSettlementDto) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException('매장을 찾을 수 없습니다');

    const exists = await this.prisma.settlement.findUnique({
      where: {
        storeId_year_month: { storeId: dto.storeId, year: dto.year, month: dto.month },
      },
    });
    if (exists) {
      throw new ConflictException('해당 매장의 해당 월 정산서가 이미 존재합니다');
    }

    const startOfMonth = new Date(dto.year, dto.month - 1, 1);
    const endOfMonth = new Date(dto.year, dto.month, 1);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId: dto.storeId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.SETTLED] },
        requestedAt: { gte: startOfMonth, lt: endOfMonth },
      },
      include: { payment: true },
    });

    const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);
    const paidAmount = orders
      .filter((o) => o.payment && o.payment.status === 'COMPLETED')
      .reduce((s, o) => s + (o.payment?.amount ?? 0), 0);
    const unpaidAmount = totalAmount - paidAmount;

    let status: SettlementStatus = SettlementStatus.PENDING;
    if (totalAmount > 0 && unpaidAmount === 0) status = SettlementStatus.COMPLETED;
    else if (paidAmount > 0) status = SettlementStatus.PARTIAL;

    const dueDate = new Date(dto.year, dto.month, 10);

    return this.prisma.settlement.create({
      data: {
        storeId: dto.storeId,
        year: dto.year,
        month: dto.month,
        totalAmount,
        paidAmount,
        unpaidAmount,
        status,
        dueDate,
      },
    });
  }

  async getPdf(user: AuthenticatedUser, id: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id },
      include: { store: { select: { id: true, storeName: true, address: true } } },
    });
    if (!settlement) throw new NotFoundException('정산서를 찾을 수 없습니다');
    if (
      user.role === UserRole.STORE_OWNER &&
      settlement.storeId !== user.storeId
    ) {
      throw new ForbiddenException('해당 정산서에 접근할 수 없습니다');
    }

    const startOfMonth = new Date(settlement.year, settlement.month - 1, 1);
    const endOfMonth = new Date(settlement.year, settlement.month, 1);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId: settlement.storeId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.SETTLED] },
        requestedAt: { gte: startOfMonth, lt: endOfMonth },
      },
      include: {
        orderItems: {
          include: { product: { select: { name: true, unit: true } } },
        },
        payment: true,
      },
      orderBy: { requestedAt: 'asc' },
    });

    return {
      settlement,
      orders,
      generatedAt: new Date(),
      note: 'PDF 미연동 — JSON 형식으로 반환',
    };
  }

  async updateStatus(id: string, dto: UpdateSettlementDto) {
    const found = await this.prisma.settlement.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('정산서를 찾을 수 없습니다');

    const data: Prisma.SettlementUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.paidAmount !== undefined) {
      if (dto.paidAmount > found.totalAmount) {
        throw new BadRequestException('paidAmount가 totalAmount를 초과합니다');
      }
      data.paidAmount = dto.paidAmount;
      data.unpaidAmount = found.totalAmount - dto.paidAmount;
    }

    return this.prisma.settlement.update({ where: { id }, data });
  }
}
