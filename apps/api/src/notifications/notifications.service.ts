import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationChannel, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotification {
  userId: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  linkUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.PUSH,
    linkUrl?: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, title, message, channel, linkUrl },
    });
  }

  async notifyOne(input: CreateNotification): Promise<void> {
    await this.createNotification(
      input.userId,
      input.title,
      input.message,
      input.channel,
      input.linkUrl,
    );
  }

  async notifyAdmins(input: Omit<CreateNotification, 'userId'>): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isApproved: true },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: input.title,
        message: input.message,
        channel: input.channel ?? NotificationChannel.PUSH,
        linkUrl: input.linkUrl,
      })),
    });
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    const found = await this.prisma.notification.findUnique({ where: { id } });
    if (!found || found.userId !== userId) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }
}
