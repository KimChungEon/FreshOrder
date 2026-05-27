import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: '발급받은 refreshToken' })
  @IsJWT()
  refreshToken!: string;
}
