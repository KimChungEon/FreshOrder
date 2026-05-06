import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardType, PostStatus, Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/comment.dto';
import { CreatePostDto, ListPostsDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: ListPostsDto) {
    const where: Prisma.PostWhereInput = {};
    if (query.boardType) where.boardType = query.boardType;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, role: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return { items, page: query.page, limit: query.limit, total };
  }

  async create(user: AuthenticatedUser, dto: CreatePostDto) {
    if (dto.boardType === BoardType.NOTICE && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('공지사항은 본사 관리자만 작성할 수 있습니다');
    }
    if (
      (dto.boardType === BoardType.QNA || dto.boardType === BoardType.SUGGESTION) &&
      user.role !== UserRole.STORE_OWNER
    ) {
      throw new ForbiddenException('Q&A / 건의는 직영점주만 작성할 수 있습니다');
    }

    const isPinned = user.role === UserRole.ADMIN ? !!dto.isPinned : false;

    return this.prisma.post.create({
      data: {
        authorId: user.sub,
        boardType: dto.boardType,
        title: dto.title,
        content: dto.content,
        isPinned,
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: { select: { id: true, name: true, role: true } },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }).catch(() => null);
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    return post;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    if (post.authorId !== user.sub) {
      throw new ForbiddenException('작성자만 수정할 수 있습니다');
    }
    if (dto.boardType && dto.boardType !== post.boardType) {
      throw new BadRequestException('게시판 종류는 변경할 수 없습니다');
    }
    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        isPinned:
          user.role === UserRole.ADMIN && dto.isPinned !== undefined
            ? dto.isPinned
            : undefined,
      },
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    if (post.authorId !== user.sub && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }

  async addComment(user: AuthenticatedUser, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: user.sub,
        content: dto.content,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // Q&A에 ADMIN이 댓글 → ANSWERED
    if (post.boardType === BoardType.QNA && user.role === UserRole.ADMIN) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: PostStatus.ANSWERED },
      });
      if (post.authorId !== user.sub) {
        await this.notifications.notifyOne({
          userId: post.authorId,
          title: '문의에 답변이 등록되었습니다',
          message: post.title,
          linkUrl: `/board/posts/${postId}`,
        });
      }
    }

    return comment;
  }

  async removeComment(user: AuthenticatedUser, postId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.postId !== postId) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }
    if (comment.authorId !== user.sub && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { ok: true };
  }
}
