import { PrismaService } from "./prisma.service";

/**
 * Returns a Prisma client that is bound to a single user for all owned models.
 * Reads are automatically constrained to that user's rows and creates are
 * stamped with the owner, so a service can never accidentally read or write
 * across users — the isolation lives here, in one place, instead of being
 * re-implemented (and eventually forgotten) in every query.
 *
 * Ownership on update/delete is enforced by first reading the row through a
 * scoped `findFirst` (which returns nothing for another user's row), so those
 * operations are safe as long as callers check existence first.
 *
 * This slice applies scoping to `blockType` and `category`; the remaining owned
 * models are brought under the same extension in a follow-up.
 */
export function userScoped(prisma: PrismaService, userId: string) {
  const scopeWhere = ({ args, query }: { args: any; query: any }) => {
    args.where = { ...args.where, userId };
    return query(args);
  };

  const stampOwner = ({ args, query }: { args: any; query: any }) => {
    // Cast: the create input is a union of checked/unchecked shapes; stamping
    // the scalar FK at runtime is what enforces ownership.
    args.data = { ...(args.data as any), userId };
    return query(args);
  };

  return prisma.$extends({
    query: {
      blockType: {
        findMany: scopeWhere,
        findFirst: scopeWhere,
        count: scopeWhere,
        updateMany: scopeWhere,
        deleteMany: scopeWhere,
        create: stampOwner,
      },
      category: {
        findMany: scopeWhere,
        findFirst: scopeWhere,
        count: scopeWhere,
        updateMany: scopeWhere,
        deleteMany: scopeWhere,
        create: stampOwner,
      },
    },
  });
}
