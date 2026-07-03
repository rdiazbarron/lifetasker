import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBlockTypeDto } from "./dto/create-block-type.dto";
import { UpdateBlockTypeDto } from "./dto/update-block-type.dto";
import { UserContextService } from "../common/user-context.service";

@Injectable()
export class BlockTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  async create(dto: CreateBlockTypeDto) {
    const userId = await this.userContext.userId();
    try {
      return await this.prisma.blockType.create({ data: { ...dto, userId } });
    } catch {
      throw new BadRequestException(
        "Unable to create block type. Check category and uniqueness constraints.",
      );
    }
  }

  async findAll() {
    const userId = await this.userContext.userId();
    return this.prisma.blockType.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const userId = await this.userContext.userId();
    const bt = await this.prisma.blockType.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!bt) throw new NotFoundException("Block type not found");
    return bt;
  }

  async update(id: string, dto: UpdateBlockTypeDto) {
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
