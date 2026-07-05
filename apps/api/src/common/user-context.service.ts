import { Inject, Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { AuthenticatedRequest } from "../auth/auth.constants";

/**
 * Resolves the current user's id for the lifetime of a single request.
 *
 * The global auth guard validates the session and attaches the authenticated
 * user id to the request before any controller runs; this service simply reads
 * it back. Every downstream service depends on this seam rather than on the
 * session lookup itself, so nothing else changed when real authentication
 * replaced the previous hardcoded, process-cached demo identity.
 *
 * The demo user still exists as local seed data — you log in as it — but it is
 * no longer resolved implicitly here.
 */
@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  constructor(
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
  ) {}

  async userId(): Promise<string> {
    const userId = this.request.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "No authenticated user in request context.",
      );
    }
    return userId;
  }
}
