import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGameDto } from './create-game.dto';

export class ImportGamesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGameDto)
  games: CreateGameDto[];
}
