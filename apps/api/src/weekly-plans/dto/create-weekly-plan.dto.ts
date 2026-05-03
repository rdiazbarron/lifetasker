import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class PlanItemDto {
  @IsString() @IsNotEmpty() blockTypeId: string;
  @IsInt() @Min(1) targetCount: number;
}
export class CreateWeeklyPlanDto {
  @IsDateString() weekStartDate: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemDto)
  items: PlanItemDto[];
}
export class UpdateWeeklyPlanItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemDto)
  items: PlanItemDto[];
}
