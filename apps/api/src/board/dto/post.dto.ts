import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BoardType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreatePostDto {
  @ApiProperty({ enum: BoardType })
  @IsEnum(BoardType)
  boardType!: BoardType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: '공지(NOTICE)일 때 ADMIN 가능' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class ListPostsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BoardType })
  @IsOptional()
  @IsEnum(BoardType)
  boardType?: BoardType;
}
