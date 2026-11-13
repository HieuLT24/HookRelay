import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CredentialsDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() credentials: CredentialsDto) {
    return this.auth.register(credentials);
  }

  @Post('login')
  login(@Body() credentials: CredentialsDto, @Req() request: Request) {
    return this.auth.login(credentials, request.ip ?? request.socket.remoteAddress ?? 'unknown');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user: AuthenticatedUser }) {
    return request.user;
  }
}
