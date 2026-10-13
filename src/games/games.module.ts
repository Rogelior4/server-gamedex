import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import {
  SteamProvider,
  EpicGamesProvider,
  NintendoProvider,
  LauncherCatalogProvider,
  RawgProvider,
  MetadataAggregatorService,
} from './providers';

@Module({
  controllers: [GamesController],
  providers: [
    SteamProvider,
    EpicGamesProvider,
    NintendoProvider,
    LauncherCatalogProvider,
    RawgProvider,
    MetadataAggregatorService,
    GamesService,
  ],
  exports: [GamesService, MetadataAggregatorService],
})
export class GamesModule {}
