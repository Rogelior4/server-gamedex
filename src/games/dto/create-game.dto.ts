import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  platform: string;
}
