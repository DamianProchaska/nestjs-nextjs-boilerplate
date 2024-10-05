import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Ten endpoint jest obsługiwany przez Passport i przekierowuje do Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // @ts-ignore
    const user = req.user as any;

    // Ustaw tokeny w ciasteczkach HTTP-only
    res.cookie('accessToken', user.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.cookie('refreshToken', user.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Przekieruj użytkownika na stronę frontendową
    res.redirect('http://localhost:3000/dashboard');
  }
}
