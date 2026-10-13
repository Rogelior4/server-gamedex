import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async create(createGameDto: CreateGameDto) {
    let coverUrl = createGameDto.coverUrl;

    // Si no se proporcionó una URL manual, la buscamos automáticamente en Steam
    if (!coverUrl) {
      const cover = await this.getGameCover(createGameDto.title);
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

  async getGameCover(title: string) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`,
        { timeout: 5000 },
      );

      if (response.data.items && response.data.items.length > 0) {
        // Check top 3 items for existing library art
        for (const item of response.data.items.slice(0, 3)) {
          const appId = item.id;
          const modernUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
          try {
            const check = await axios.head(modernUrl, { timeout: 3000 });
            if (check.status === 200) {
              return { url: modernUrl };
            }
          } catch {
            // Try legacy CDN or header as backup
            const legacyUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;
            try {
              const checkLegacy = await axios.head(legacyUrl, { timeout: 3000 });
              if (checkLegacy.status === 200) {
                return { url: legacyUrl };
              }
            } catch {}
          }
        }

        // Fallback to top item header
        const topId = response.data.items[0].id;
        return {
          url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${topId}/header.jpg`,
        };
      }
      return { url: null };
    } catch (error) {
      return { url: null };
    }
  }

  async searchSteam(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query.trim())}&l=english&cc=US`,
        { timeout: 5000 },
      );

      if (!response.data.items || !Array.isArray(response.data.items)) {
        return [];
      }

      return response.data.items.slice(0, 8).map((item: any) => {
        const appId = item.id;
        const libraryCoverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
        const headerUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
        return {
          id: appId,
          title: item.name,
          coverUrl: libraryCoverUrl,
          headerUrl: headerUrl,
          tinyImage: item.tiny_image || headerUrl,
          platforms: item.platforms || {},
        };
      });
    } catch (error) {
      return [];
    }
  }

  async update(id: number, updateGameDto: UpdateGameDto) {
    const existing = await this.findOne(id);
    let coverUrl: string | null | undefined = updateGameDto.coverUrl;

    // Si el título cambió y no se pasó una portada específica, re-buscamos la carátula
    if (updateGameDto.title && updateGameDto.title !== existing.title && coverUrl === undefined) {
      const cover = await this.getGameCover(updateGameDto.title);
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
      const cover = await this.getGameCover(game.title);
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
          const cover = await this.getGameCover(item.title);
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
