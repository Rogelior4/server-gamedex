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

import { SteamAccountService } from './steam-account.service';

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
    SteamAccountService,
  ],
  exports: [GamesService, MetadataAggregatorService, SteamAccountService],
})
export class GamesModule {}
