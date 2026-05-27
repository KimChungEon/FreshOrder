import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_SALT = 10;
const VALID_INVITE_CODE = 'FRESH2026';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    if (dto.inviteCode !== VALID_INVITE_CODE) {
      throw new BadRequestException('초대 코드가 올바르지 않습니다');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다');
    }

    if (dto.role === UserRole.STORE_OWNER && (!dto.storeName || !dto.address)) {
      throw new BadRequestException('직영점주 가입 시 매장명과 주소가 필요합니다');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT);
    const isApproved = dto.role === UserRole.ADMIN;

    const userData: Prisma.UserCreateInput = {
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      role: dto.role,
      inviteCode: dto.inviteCode,
      isApproved,
    };

    const user = await this.prisma.user.create({ data: userData });

    if (dto.role === UserRole.STORE_OWNER) {
      await this.prisma.store.create({
        data: {
          ownerId: user.id,
          storeName: dto.storeName!,
          address: dto.address!,
          phone: dto.phone,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: { id: string; email: string; role: UserRole; storeId: string | null } }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { stores: { select: { id: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    if (!user.isApproved) {
      throw new ForbiddenException('승인 대기 중인 계정입니다');
    }

    const storeId = user.stores[0]?.id ?? null;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      storeId,
    };

    const tokens = await this.signTokens(payload);
    return { ...tokens, user: { id: user.id, email: user.email, role: user.role, storeId } };
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    let decoded: JwtPayload;
    try {
      decoded = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('refresh token이 유효하지 않습니다');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { stores: { select: { id: true } } },
    });
    if (!user || !user.isApproved) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const storeId = user.stores[0]?.id ?? null;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, storeId } satisfies JwtPayload,
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRATION') ?? '15m',
      },
    );
    return { accessToken };
  }

  private async signTokens(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRATION') ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
