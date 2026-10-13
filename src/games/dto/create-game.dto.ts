import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { GameStatus } from '@prisma/client';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsOptional()
  coverUrl?: string | null;

  @IsEnum(GameStatus)
  @IsOptional()
  status?: GameStatus;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number | null;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  hoursPlayed?: number | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
