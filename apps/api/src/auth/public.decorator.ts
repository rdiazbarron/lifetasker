import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "./auth.constants";

/**
 * Marks a route (or controller) as reachable without a valid session, letting
 * it through the global auth guard. Used for health checks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
