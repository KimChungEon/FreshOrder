import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectOrderDto {
  @ApiProperty({ example: '재고 부족으로 일부 품목 미배송' })
  @IsString()
  @IsNotEmpty()
  rejectReason!: string;
}
