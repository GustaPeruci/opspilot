import { Body, Controller, Header, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { LoginService } from './login.service';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionService } from './session.service';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(1024)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly sessions: SessionService,
  ) {}

  @Post('login')
  @Header('Cache-Control', 'no-store')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    return this.loginService.login(body.email, body.password);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  async logout(@Req() request: { user: { userId: string; sessionId: string } }) {
    await this.sessions.revoke(request.user.sessionId, request.user.userId);
  }
}
