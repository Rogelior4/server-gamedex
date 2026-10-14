import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GameStatus } from '@prisma/client';

export class SteamGameItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsOptional()
  appId?: number;

  @IsString()
  @IsOptional()
  coverUrl?: string | null;

  @IsInt()
  @IsOptional()
  hoursPlayed?: number | null;

  @IsEnum(GameStatus)
  @IsOptional()
  status?: GameStatus;
}

export class ImportSteamGamesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SteamGameItemDto)
  games: SteamGameItemDto[];

  @IsBoolean()
  @IsOptional()
  updateExistingHours?: boolean;
}
