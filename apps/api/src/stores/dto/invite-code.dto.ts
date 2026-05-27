import { ApiProperty } from '@nestjs/swagger';

export class InviteCodeResponseDto {
  @ApiProperty({ example: 'A1B2C3' })
  code!: string;
}
