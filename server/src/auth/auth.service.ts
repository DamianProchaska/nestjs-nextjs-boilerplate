// src/auth/auth.service.ts

import { PrismaService } from 'nestjs-prisma';
import { Prisma, User } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { SignupInput } from './dto/signup.input';
import { Token } from './models/token.model';
import { SecurityConfig } from '../common/configs/config.interface';
import * as crypto from 'crypto';
import { addMinutes } from 'date-fns';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
  ) {}

  // User Registration with Email and Password
  async createUser(payload: SignupInput): Promise<Token> {
    const hashedPassword = await this.passwordService.hashPassword(
      payload.password,
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          ...payload,
          email: payload.email.toLowerCase(),
          password: hashedPassword,
          role: 'USER',
        },
      });

      return this.generateTokens({ userId: user.id });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Email ${payload.email} is already in use.`,
        );
      }
      throw new InternalServerErrorException(
        'An error occurred while creating user.',
      );
    }
  }

  // Traditional Email/Password Login
  async login(email: string, password: string): Promise<Token> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException(`No user found for email: ${email}`);
    }

    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new BadRequestException('Invalid password');
    }

    return this.generateTokens({ userId: user.id });
  }

  // Google OAuth Login
  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    firstname: string;
    lastname: string;
  }): Promise<{ user: User; tokens: Token }> {
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      // Check if user with email exists
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Update existing user with googleId
        user = await this.prisma.user.update({
          where: { email: profile.email },
          data: { googleId: profile.googleId },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: profile.email.toLowerCase(),
            firstname: profile.firstname,
            lastname: profile.lastname,
            googleId: profile.googleId,
            role: 'USER',
          },
        });
      }
    }

    const tokens = this.generateTokens({ userId: user.id });

    return { user, tokens };
  }

  // Passwordless Login: Send Magic Link and OTP
  async sendMagicLink(email: string): Promise<void> {
    let user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          role: 'USER', // Assign default role
        },
      });
    }

    // Generate magic link token
    const magicLinkToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: '15m',
        secret: this.configService.get<string>('JWT_MAGIC_LINK_SECRET'),
      },
    );

    const magicLink = `${this.configService.get<string>(
      'FRONTEND_URL',
    )}/auth/magic-link?token=${magicLinkToken}`;

    // Generate OTP
    const otp = this.generateOTP();

    // Hash and save OTP to the user record with expiration
    await this.prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        otpHash: this.hashOTP(otp),
        otpExpiresAt: addMinutes(new Date(), 15),
      },
    });

    // Send email with magic link and OTP
    await this.mailerService.sendMagicLinkAndOTP(email, magicLink, otp);
  }

  // Verify Magic Link
  async verifyMagicLink(token: string): Promise<Token> {
    try {
      const payload = this.jwtService.verify<{ userId: string }>(token, {
        secret: this.configService.get<string>('JWT_MAGIC_LINK_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) throw new UnauthorizedException('Invalid token');

      return this.generateTokens({ userId: user.id });
    } catch (e) {
      throw new BadRequestException('Invalid or expired magic link');
    }
  }

  // Verify OTP
  async verifyOTP(email: string, otp: string): Promise<Token> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user)
      throw new NotFoundException('No user found with this email address.');

    if (!user.otpHash || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = this.verifyHashedOTP(otp, user.otpHash);
    if (!isValid) throw new UnauthorizedException('Invalid OTP');

    // Clear OTP fields after successful verification
    await this.prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return this.generateTokens({ userId: user.id });
  }

  // Generate OTP
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  }

  // Hash OTP using SHA-256
  private hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  // Verify hashed OTP
  private verifyHashedOTP(otp: string, otpHash: string): boolean {
    return this.hashOTP(otp) === otpHash;
  }

  // Generate JWT Tokens
  generateTokens(payload: { userId: string }): Token {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  // Generate Access Token
  private generateAccessToken(payload: { userId: string }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    return this.jwtService.sign(payload, {
      expiresIn: securityConfig.expiresIn,
    });
  }

  // Generate Refresh Token
  private generateRefreshToken(payload: { userId: string }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    return this.jwtService.sign(payload, {
      expiresIn: securityConfig.refreshIn,
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  // Refresh Token
  refreshToken(token: string): Token {
    try {
      const { userId } = this.jwtService.verify<{ userId: string }>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens({ userId });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Logout (optional if using stateless JWT, but good for clearing cookies)
  async logout(): Promise<void> {
    // If using session-based auth, invalidate the session here
    // For JWT, you might implement token blacklisting if necessary
  }

  validateUser(userId: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // Get User from Token
  async getUserFromToken(token: string): Promise<User> {
    try {
      const decoded = this.jwtService.verify<{ userId: string }>(token);
      return await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
