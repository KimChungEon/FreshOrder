import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.requireExists(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.requireExists(id);
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new BadRequestException(
        `카테고리에 연결된 품목 ${productCount}개가 있어 삭제할 수 없습니다`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async requireExists(id: string) {
    const found = await this.prisma.category.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('카테고리를 찾을 수 없습니다');
    return found;
  }
}
