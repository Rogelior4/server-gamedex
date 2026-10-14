import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto, UpdateGameDto, ImportGamesDto } from './dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.create(createGameDto);
  }

  @Post('import')
  bulkImport(@Body() importGamesDto: ImportGamesDto) {
    return this.gamesService.bulkImport(importGamesDto.games);
  }

  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @Post('sync-covers')
  syncCovers() {
    return this.gamesService.syncMissingCovers();
  }

  /**
   * Búsqueda universal / multi-tienda (Steam, Epic, Nintendo, Riot, Battle.net, EA, Ubisoft, Xbox, PlayStation)
   */
  @Get('search')
  search(
    @Query('term') term: string,
    @Query('platform') platform?: string,
  ) {
    return this.gamesService.search(term, platform);
  }

  /**
   * Endpoint específico para Steam (retrocompatible)
   */
  @Get('search-steam')
  searchSteam(@Query('term') term: string) {
    return this.gamesService.searchSteam(term);
  }

  /**
   * Obtiene la mejor carátula para un título, opcionalmente filtrado por plataforma
   */
  @Get('cover/:title')
  getGameCover(
    @Param('title') title: string,
    @Query('platform') platform?: string,
  ) {
    return this.gamesService.getGameCover(title, platform);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gamesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGameDto: UpdateGameDto,
  ) {
    return this.gamesService.update(id, updateGameDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gamesService.remove(id);
  }
}
