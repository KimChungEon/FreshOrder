import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export enum InventoryStatus {
  EMPTY = 'EMPTY',
  SHORTAGE = 'SHORTAGE',
  WARNING = 'WARNING',
  SUFFICIENT = 'SUFFICIENT',
}

export class InventoryItemInputDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  currentQty!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQty?: number;
}

export class BulkUpdateInventoryDto {
  @ApiProperty({ type: [InventoryItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryItemInputDto)
  items!: InventoryItemInputDto[];
}

export class UpdateInventoryDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  currentQty!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQty?: number;
}

export class ListInventoryQueryDto {
  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}
