import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MetadataAggregatorService, GameSearchResult } from './providers';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metadataAggregator: MetadataAggregatorService,
  ) { }

  async create(createGameDto: CreateGameDto) {
    let coverUrl = createGameDto.coverUrl;

    // Si no se proporcionó una URL manual, la buscamos automáticamente con el agregador multi-tienda
    if (!coverUrl) {
      const cover = await this.getGameCover(createGameDto.title, createGameDto.platform);
      coverUrl = cover.url ?? undefined;
    }

    return this.prisma.game.create({
      data: {
        ...createGameDto,
        coverUrl: coverUrl ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.game.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  /**
   * Búsqueda multi-tienda compatible con Steam, Epic Games, Nintendo, Riot, Battle.net, EA, Ubisoft, Xbox, PlayStation, etc.
   */
  async search(query: string, platform?: string): Promise<GameSearchResult[]> {
    return this.metadataAggregator.search(query, platform);
  }

  /**
   * Endpoint retrocompatible para clientes que usan /search-steam específicamente
   */
  async searchSteam(query: string) {
    return this.metadataAggregator.search(query, 'steam');
  }

  /**
   * Obtiene la mejor carátula disponible usando cascada de proveedores según la plataforma
   */
  async getGameCover(title: string, platform?: string) {
    return this.metadataAggregator.getBestCover(title, platform);
  }

  async update(id: number, updateGameDto: UpdateGameDto) {
    const existing = await this.findOne(id);
    let coverUrl: string | null | undefined = updateGameDto.coverUrl;

    // Si el título cambió y no se pasó una portada específica, re-buscamos la carátula según plataforma
    if (updateGameDto.title && updateGameDto.title !== existing.title && coverUrl === undefined) {
      const targetPlatform = updateGameDto.platform || existing.platform;
      const cover = await this.getGameCover(updateGameDto.title, targetPlatform);
      coverUrl = cover.url ?? null;
    }

    return this.prisma.game.update({
      where: { id },
      data: {
        ...updateGameDto,
        ...(coverUrl !== undefined ? { coverUrl } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.game.delete({
      where: { id },
    });
  }

  async syncMissingCovers() {
    const gamesWithoutCover = await this.prisma.game.findMany({
      where: {
        coverUrl: null,
      },
    });

    let updated = 0;
    for (const game of gamesWithoutCover) {
      const cover = await this.getGameCover(game.title, game.platform);
      if (cover.url) {
        await this.prisma.game.update({
          where: { id: game.id },
          data: { coverUrl: cover.url },
        });
        updated++;
      }
    }

    return { total: gamesWithoutCover.length, updated };
  }

  async bulkImport(items: CreateGameDto[]) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { count: 0, games: [] };
    }

    const createdGames: any[] = [];
    for (const item of items) {
      let coverUrl = item.coverUrl;
      if (!coverUrl) {
        try {
          const cover = await this.getGameCover(item.title, item.platform);
          coverUrl = cover.url ?? null;
        } catch {
          coverUrl = null;
        }
      }

      const created = await this.prisma.game.create({
        data: {
          title: item.title,
          platform: item.platform,
          coverUrl: coverUrl ?? null,
          status: item.status ?? 'BACKLOG',
          rating: item.rating ?? null,
          isFavorite: item.isFavorite ?? false,
          hoursPlayed: item.hoursPlayed ?? 0,
          notes: item.notes ?? null,
        },
      });
      createdGames.push(created);
    }

    return { count: createdGames.length, games: createdGames };
  }
}
