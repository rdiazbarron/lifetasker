import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from '../common/demo-user';
import { getWeekBounds } from '../common/week';

@Injectable()
export class ProgressService {
 constructor(private prisma:PrismaService){}
 private async userId(){return (await this.prisma.user.upsert({where:{email:DEMO_USER_EMAIL},update:{},create:{email:DEMO_USER_EMAIL,name:DEMO_USER_NAME}})).id;}
 async currentWeek(){ const userId=await this.userId(); const {weekStart,weekEnd}=getWeekBounds(new Date());
 const plan=await this.prisma.weeklyPlan.findUnique({where:{userId_weekStart:{userId,weekStart}},include:{planItems:{include:{blockType:{include:{category:true}}}}}});
 const completed=await this.prisma.blockInstance.findMany({where:{userId,completedAt:{gte:weekStart,lte:weekEnd}},include:{blockType:{include:{category:true}}}});
 const totalTarget=(plan?.planItems||[]).reduce((a,b)=>a+b.targetCount,0); const totalCompleted=completed.length; const progressPercentage=totalTarget>0?Math.round((totalCompleted/totalTarget)*100):0;
 const byType=(plan?.planItems||[]).map((i)=>({blockTypeId:i.blockTypeId,blockTypeName:i.blockType.name,target:i.targetCount,completed:completed.filter(c=>c.blockTypeId===i.blockTypeId).length}));
 const byCategory=Object.values((plan?.planItems||[]).reduce((acc:any,i)=>{const key=i.blockType.categoryId; if(!acc[key])acc[key]={categoryId:key,categoryName:i.blockType.category.name,target:0,completed:0}; acc[key].target+=i.targetCount; acc[key].completed+=completed.filter(c=>c.blockType.categoryId===key).length; return acc;},{}));
 const level = totalCompleted>=15?4:totalCompleted>=9?3:totalCompleted>=4?2:1;
 return { totalTargetBlocks:totalTarget,totalCompletedBlocks:totalCompleted,progressPercentage,progressByBlockType:byType,progressByCategory:byCategory,weeklyLevel:level}; }
}
