import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateProductDto {
  @ApiProperty({ description: '카테고리 id' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: '떡볶이 양념 소스' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '1kg' })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiProperty({ example: 8500 })
  @IsInt()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQty?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ListProductsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: '품목명 부분 검색' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: true, description: '활성 품목만 (기본 true)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly: boolean = true;
}
