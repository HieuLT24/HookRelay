import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialsDto } from './auth.dto';
import { AuthenticatedUser } from './auth.types';
import { LoginThrottleService } from './login-throttle.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly loginThrottle: LoginThrottleService,
  ) {}

  async register(credentials: CredentialsDto): Promise<AuthenticatedUser> {
    const email = this.normalizeEmail(credentials.email);
    const passwordHash = await argon2.hash(credentials.password);

    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with that email already exists');
      }
      throw error;
    }
  }

  async login(credentials: CredentialsDto, ip: string) {
    const email = this.normalizeEmail(credentials.email);
    this.loginThrottle.assertAllowed(ip, email);

    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user ? await argon2.verify(user.passwordHash, credentials.password) : false;

    if (!valid || !user) {
      this.loginThrottle.recordFailure(ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginThrottle.clear(ip, email);
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
