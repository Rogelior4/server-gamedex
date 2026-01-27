import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GamesModule } from './games/games.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GamesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
