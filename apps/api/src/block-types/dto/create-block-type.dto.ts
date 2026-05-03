import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
export class CreateBlockTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsInt() @Min(1) durationMinutes: number;
  @IsString() @IsNotEmpty() categoryId: string;
  @IsOptional() @IsString() description?: string;
}
