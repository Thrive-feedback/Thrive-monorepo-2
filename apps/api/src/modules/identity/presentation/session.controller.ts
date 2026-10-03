import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import type { SessionCookies } from '../application/port/identity.port';
import { GetCurrentSessionUseCase } from '../application/use-cases/get-current-session.use-case';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session.use-case';
import { SignOutUseCase } from '../application/use-cases/sign-out.use-case';
import { StartGoogleSignInUseCase } from '../application/use-cases/start-google-sign-in.use-case';
import { GetCurrentSessionResponseDto } from './dto/get-current-session.dto';
import { StartGoogleSignInResponseDto } from './dto/start-google-sign-in.dto';

/** The browser's cookie header, forwarded by the web server. Absent when signed out. */
const COOKIE_HEADER = {
  name: 'cookie',
  required: false,
  description: "The browser's cookie header, forwarded by the web server.",
};

function setSessionCookies(response: Response, cookies: SessionCookies): void {
  for (const cookie of cookies) {
    response.append('Set-Cookie', cookie);
  }
}

/**
 * The session is the resource, and `current` is the caller's own. The web server calls
 * these on the browser's behalf, forwarding the browser's `cookie` header in and copying
 * `Set-Cookie` back out; the browser never calls them itself.
 *
 * Public on purpose: signing in has to work while signed out, and each route only ever
 * touches the caller's own session.
 */
@ApiTags('sessions')
@Controller({ path: 'v1/sessions' })
export class SessionController {
  constructor(
    private readonly startGoogleSignInUseCase: StartGoogleSignInUseCase,
    private readonly getCurrentSessionUseCase: GetCurrentSessionUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly signOutUseCase: SignOutUseCase,
  ) {}

  @Post('google')
  @ApiOperation({ summary: 'Start signing in with Google' })
  @ZodResponse({ status: HttpStatus.OK, type: StartGoogleSignInResponseDto })
  async startGoogleSignIn(@Res({ passthrough: true }) response: Response) {
    const signIn = await this.startGoogleSignInUseCase.execute();
    setSessionCookies(response, signIn.sessionCookies);
    return { url: signIn.url };
  }

  @Get('current')
  @ApiOperation({
    summary: 'Read who the caller is signed in as, without changing anything',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetCurrentSessionResponseDto })
  async getCurrentSession(@Headers('cookie') cookie?: string) {
    const session = await this.getCurrentSessionUseCase.execute({
      credential: cookie ?? '',
    });
    return {
      account: session.account
        ? { email: session.account.email, name: session.account.name }
        : null,
      needsRefresh: session.needsRefresh,
    };
  }

  @Post('current/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Push the current session forward and reissue its cookie',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse()
  async refreshSession(
    @Headers('cookie') cookie: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshed = await this.refreshSessionUseCase.execute({
      credential: cookie ?? '',
    });
    setSessionCookies(response, refreshed.sessionCookies);
  }

  @Delete('current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sign out of the current session' })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse()
  async signOut(
    @Headers('cookie') cookie: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const signedOut = await this.signOutUseCase.execute({
      credential: cookie ?? '',
    });
    setSessionCookies(response, signedOut.sessionCookies);
  }
}
