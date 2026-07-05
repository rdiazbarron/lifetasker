import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import {
  AuthenticatedRequest,
  IS_PUBLIC_KEY,
  extractSessionToken,
} from "./auth.constants";

/**
 * Global authentication guard. Every request must carry a valid Better Auth
 * session cookie; the guard validates it via a shared-database session lookup
 * (the same Postgres the web app writes sessions to) and attaches the resolved
 * user id to the request. Unauthenticated or expired requests are rejected with
 * 401 before any controller runs. Routes marked `@Public()` bypass this.
 *
 * The token is opaque, high-entropy, and stored server-side, so a database
 * lookup is sufficient to authenticate; the cookie's HMAC signature is not
 * re-verified here.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const token = extractSessionToken(request.headers.cookie);
    if (!token) throw new UnauthorizedException("Authentication required.");

    const session = await this.prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Invalid or expired session.");
    }

    request.userId = session.userId;
    return true;
  }
}
