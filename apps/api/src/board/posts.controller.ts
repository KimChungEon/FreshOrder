import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/comment.dto';
import { CreatePostDto, ListPostsDto, UpdatePostDto } from './dto/post.dto';
import { PostsService } from './posts.service';

@ApiTags('board')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Get()
  list(@Query() query: ListPostsDto) {
    return this.service.list(query);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.remove(user, id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(user, id, dto);
  }

  @Delete(':id/comments/:commentId')
  removeComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
  ) {
    return this.service.removeComment(user, id, commentId);
  }
}
