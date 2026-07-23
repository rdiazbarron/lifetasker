import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { userScoped } from "../prisma/user-scoped";
import { CreateBlockTypeDto } from "./dto/create-block-type.dto";
import { UpdateBlockTypeDto } from "./dto/update-block-type.dto";
import { UserContextService } from "../common/user-context.service";

@Injectable()
export class BlockTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  // A Prisma client scoped to the current user: reads only their rows and
  // stamps their id on creates. See prisma/user-scoped.ts.
  private async scoped() {
    return userScoped(this.prisma, await this.userContext.userId());
  }

  async create(dto: CreateBlockTypeDto) {
    const db = await this.scoped();
    try {
      // userId is stamped by the scoped extension, so it is intentionally
      // absent from the DTO here.
      return await db.blockType.create({ data: dto as any });
    } catch {
      throw new BadRequestException(
        "Unable to create block type. Check category and uniqueness constraints.",
      );
    }
  }

  async findAll() {
    const db = await this.scoped();
    // Archived block types are soft-deleted: hidden here (and thus from the
    // planner and quick-complete, which both read this) while their history is
    // preserved. See remove().
    return db.blockType.findMany({
      where: { archivedAt: null },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const db = await this.scoped();
    const bt = await db.blockType.findFirst({
      where: { id },
      include: { category: true },
    });
    if (!bt) throw new NotFoundException("Block type not found");
    return bt;
  }

  async update(id: string, dto: UpdateBlockTypeDto) {
    // Scoped read enforces ownership: another user's id resolves to not-found.
    await this.findOne(id);
    return this.prisma.blockType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    // Scoped read enforces ownership: another user's id resolves to not-found.
    await this.findOne(id);
    // Soft delete: stamp archivedAt rather than DELETE. A hard delete is
    // rejected by the DB whenever the type has plan items or completions
    // (onDelete: Restrict), and would erase the points/emblems those
    // completions earned. Idempotent — archiving an already-archived type is a
    // no-op re-stamp.
    await this.prisma.blockType.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return { message: "Block type deleted" };
  }
}
