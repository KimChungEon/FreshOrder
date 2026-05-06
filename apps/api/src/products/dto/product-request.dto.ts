import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductRequestStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductRequestDto {
  @ApiProperty({ example: '신메뉴 떡볶이 소스' })
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProductRequestStatusDto {
  @ApiProperty({ enum: [ProductRequestStatus.APPROVED, ProductRequestStatus.REJECTED] })
  @IsEnum(ProductRequestStatus)
  @IsIn([ProductRequestStatus.APPROVED, ProductRequestStatus.REJECTED])
  status!: ProductRequestStatus;
}
