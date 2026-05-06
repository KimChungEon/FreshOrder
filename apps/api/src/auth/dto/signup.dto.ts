import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'gangnam@freshorder.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: '강남점주' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STORE_OWNER })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'FRESH2026', description: '본사 발급 초대 코드' })
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

  @ApiPropertyOptional({ description: 'STORE_OWNER 가입 시 매장명' })
  @ValidateIf((o: SignupDto) => o.role === UserRole.STORE_OWNER)
  @IsString()
  @IsNotEmpty()
  storeName?: string;

  @ApiPropertyOptional({ description: 'STORE_OWNER 가입 시 매장 주소' })
  @ValidateIf((o: SignupDto) => o.role === UserRole.STORE_OWNER)
  @IsString()
  @IsNotEmpty()
  address?: string;
}
