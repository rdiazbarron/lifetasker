import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "./demo-user";

/**
 * Resolves the current user's id. Today it upserts a single demo user and
 * caches the result for the lifetime of the process — the demo identity never
 * changes, so there is no reason to hit the database on every read.
 *
 * This is the seam where real authentication plugs in: swap the resolution for
 * a request-scoped principal (from a guard) and nothing downstream changes,
 * because every service already depends on this interface rather than on the
 * user lookup itself.
 */
@Injectable()
export class UserContextService {
  private cachedUserId?: string;

  constructor(private readonly prisma: PrismaService) {}

  async userId(): Promise<string> {
    if (this.cachedUserId) return this.cachedUserId;

    const user = await this.prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: { email: DEMO_USER_EMAIL, name: DEMO_USER_NAME },
    });

    this.cachedUserId = user.id;
    return user.id;
  }
}
