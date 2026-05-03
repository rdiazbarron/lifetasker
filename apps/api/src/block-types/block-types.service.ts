import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockTypeDto } from './dto/create-block-type.dto';
import { UpdateBlockTypeDto } from './dto/update-block-type.dto';
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from '../common/demo-user';

@Injectable()
export class BlockTypesService {
  constructor(private readonly prisma: PrismaService) {}
  private async demoUserId() { const u=await this.prisma.user.upsert({where:{email:DEMO_USER_EMAIL},update:{},create:{email:DEMO_USER_EMAIL,name:DEMO_USER_NAME}}); return u.id; }
  async create(dto: CreateBlockTypeDto){ const userId=await this.demoUserId(); return this.prisma.blockType.create({data:{...dto,userId}}); }
  async findAll(){ const userId=await this.demoUserId(); return this.prisma.blockType.findMany({where:{userId},include:{category:true},orderBy:{name:'asc'}}); }
  async findOne(id:string){ const userId=await this.demoUserId(); const bt=await this.prisma.blockType.findFirst({where:{id,userId},include:{category:true}}); if(!bt) throw new NotFoundException('Block type not found'); return bt; }
  async update(id:string,dto:UpdateBlockTypeDto){ await this.findOne(id); return this.prisma.blockType.update({where:{id},data:dto}); }
  async remove(id:string){ await this.findOne(id); try { await this.prisma.blockType.delete({where:{id}}); return { message:'Block type deleted' }; } catch { throw new BadRequestException('Block type cannot be deleted because it is used in existing plans or completions.'); } }
}
