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
    return db.blockType.findMany({
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
    await this.findOne(id);
    try {
      await this.prisma.blockType.delete({ where: { id } });
      return { message: "Block type deleted" };
    } catch {
      throw new BadRequestException(
        "Block type cannot be deleted because it is used in existing plans or completions.",
      );
    }
  }
}
