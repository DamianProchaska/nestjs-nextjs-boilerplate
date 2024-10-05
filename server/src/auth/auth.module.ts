import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PasswordService } from './password.service';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { SecurityConfig } from '../common/configs/config.interface';
import { GoogleStrategy } from "./strategies/google.strategy";
import { MailerModule } from "../mailer/mailer.module";
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const securityConfig = configService.get<SecurityConfig>('security');
        return {
          secret: configService.get<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: securityConfig.expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    ConfigModule,
    MailerModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    GoogleStrategy,
    GqlAuthGuard,
    PasswordService,
  ],
  exports: [GqlAuthGuard],
})
export class AuthModule {}
