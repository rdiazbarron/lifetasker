import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
export class CompleteBlockDto {
  @IsString() @IsNotEmpty() blockTypeId: string;
  @IsOptional() @IsDateString() completedAt?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsString() notes?: string;
}
