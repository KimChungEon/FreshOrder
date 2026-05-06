import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ListProductsDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsDto) {
    const where: Prisma.ProductWhereInput = {};
    if (query.activeOnly) where.isActive = true;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  }

  async findOne(id: string) {
    const found = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!found) throw new NotFoundException('품목을 찾을 수 없습니다');
    return found;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        unit: dto.unit,
        unitPrice: dto.unitPrice,
        imageUrl: dto.imageUrl,
        minOrderQty: dto.minOrderQty ?? 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
