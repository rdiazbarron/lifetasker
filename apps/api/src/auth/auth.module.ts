import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";

/**
 * Registers the authentication guard globally, so every route requires a valid
 * session unless explicitly marked `@Public()`.
 */
@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
