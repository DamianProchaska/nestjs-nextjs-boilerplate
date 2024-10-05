import {
  Resolver,
  Mutation,
  Args,
  Parent,
  ResolveField,
  Context,
} from '@nestjs/graphql';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './models/auth.model';
import { Token } from './models/token.model';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { User } from '../users/models/user.model';
import { PasswordlessLoginInput } from "./dto/passwordless-login.input";
import { VerifyOtpInput } from "./dto/verify-otp.input";

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => Auth)
  async signup(@Args('data') data: SignupInput) {
    data.email = data.email.toLowerCase();
    const { accessToken, refreshToken } = await this.auth.createUser(data);
    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => Auth)
  async login(
    @Args('data') { email, password }: LoginInput,
    @Context() context: { res: Response }, // Access the response context
  ) {
    const { accessToken, refreshToken } = await this.auth.login(
      email.toLowerCase(),
      password,
    );

    // Set the tokens in HTTP-only cookies
    context.res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    context.res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => Boolean)
  async requestPasswordlessSignupOrLogin(
    @Args('data') { email }: PasswordlessLoginInput,
  ): Promise<boolean> {
    await this.auth.sendMagicLink(email);
    return true;
  }

  // Verify Magic Link
  @Mutation(() => Auth)
  async verifyMagicLink(
    @Args('token') token: string,
    @Context() context: { res: Response },
  ) {
    const tokens = await this.auth.verifyMagicLink(token);
    this.setAuthCookies(context.res, tokens);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Verify OTP
  @Mutation(() => Auth)
  async verifyOTP(
    @Args('data') { email, otp }: VerifyOtpInput,
    @Context() context: { res: Response },
  ) {
    const tokens = await this.auth.verifyOTP(email, otp);
    this.setAuthCookies(context.res, tokens);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Mutation(() => Token)
  async refreshToken(
    @Context() context: { req: Request; res: Response },
  ): Promise<Token> {
    const refreshToken = context.req.cookies['refreshToken']; // Retrieve refresh token from cookies

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    // Call AuthService to verify and refresh the token
    const newTokens = await this.auth.refreshToken(refreshToken);

    // Set new tokens as cookies
    context.res.cookie('accessToken', newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    context.res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return newTokens;
  }

  @Mutation(() => Boolean)
  async logout(@Context() context: { res: Response }): Promise<boolean> {
    context.res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Używaj secure w produkcji
      sameSite: 'lax',
    });

    context.res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return true;
  }

  @ResolveField('user', () => User)
  async user(@Parent() auth: Auth) {
    return await this.auth.getUserFromToken(auth.accessToken);
  }

  private setAuthCookies(res: Response, tokens: Token) {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
}
