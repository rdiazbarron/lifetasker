import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { userScoped } from "../prisma/user-scoped";
import { UserContextService } from "../common/user-context.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  // A Prisma client scoped to the current user: reads only their categories and
  // stamps their id on creates. See prisma/user-scoped.ts.
  private async scoped() {
    return userScoped(this.prisma, await this.userContext.userId());
  }

  async findAll() {
    const db = await this.scoped();
    return db.category.findMany({ orderBy: { name: "asc" } });
  }

  async create(data: CreateCategoryDto) {
    const db = await this.scoped();
    const name = data.name.trim();
    const base = this.toKey(name) || "CATEGORY";

    // `key` is unique per user. Derive it from the name, and on collision within
    // this user append an incrementing suffix so distinct categories don't clash.
    for (let attempt = 0; attempt < 100; attempt++) {
      const key = attempt === 0 ? base : `${base}_${attempt + 1}`;
      try {
        // userId is stamped by the scoped extension, so it is intentionally
        // absent from the data here.
        return await db.category.create({
          data: {
            key,
            name,
            ...(data.weightPercent !== undefined
              ? { weightPercent: data.weightPercent }
              : {}),
            ...(data.color !== undefined ? { color: data.color } : {}),
          } as any,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Unable to derive a unique key for category "${name}"`);
  }

  private toKey(name: string) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  async update(id: string, data: UpdateCategoryDto) {
    const db = await this.scoped();
    // Scoped read enforces ownership: another user's id resolves to not-found.
    const existing = await db.category.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException("Category not found");

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.weightPercent !== undefined
          ? { weightPercent: data.weightPercent }
          : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
      },
    });
  }
}
