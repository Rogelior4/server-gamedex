import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  create(createGameDto: CreateGameDto) {
    return this.prisma.game.create({
      data: createGameDto,
    });
  }

  findAll() {
    return this.prisma.game.findMany();
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

  async update(id: number, updateGameDto: UpdateGameDto) {
    await this.findOne(id);
    return this.prisma.game.update({
      where: { id },
      data: updateGameDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.game.delete({
      where: { id },
    });
  }
}
