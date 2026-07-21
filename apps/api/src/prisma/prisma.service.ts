import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  // Prisma 5 removed the `beforeExit` event for the library engine, so the old
  // `$on("beforeExit")` hook no longer type-checks. Nest's own lifecycle hook is
  // the current recommended pattern: disconnect the client when the module is
  // torn down (app shutdown or test `app.close()`).
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
