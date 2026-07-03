import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async create(data: CreateCategoryDto) {
    const name = data.name.trim();
    const base = this.toKey(name) || "CATEGORY";

    // `key` is unique. Derive it from the name, and on collision append an
    // incrementing suffix so distinct categories never clash on the index.
    for (let attempt = 0; attempt < 100; attempt++) {
      const key = attempt === 0 ? base : `${base}_${attempt + 1}`;
      try {
        return await this.prisma.category.create({ data: { key, name } });
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

  update(id: string, data: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      },
    });
  }
}
