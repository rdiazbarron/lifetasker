import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateBlockTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() description?: string;
}
