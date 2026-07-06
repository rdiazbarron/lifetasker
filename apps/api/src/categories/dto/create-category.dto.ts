import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

// Hex color like #rrggbb; used by the overview grid and contribution heatmap.
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Importance bonus as a percent. Capped to 0..100 (baseline to double); no
  // below-baseline penalties are allowed.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weightPercent?: number;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: "color must be a hex value like #6366f1" })
  color?: string;
}
