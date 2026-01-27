import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PrismaService } from 'src/prisma/prisma.service';
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

  findOne(id: number) {
    return this.prisma.game.findUnique({
      where: { id },
    });
  }

  async getGameCover(title: string) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${title}&l=english&cc=US`,
      );

      if (response.data.items && response.data.items.length > 0) {
        const appId = response.data.items[0].id;
        return {
          url: `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`,
        };
      }
      return { url: null };
    } catch (error) {
      console.error('Error buscando portada para ' + title, error.message);
      return { url: null };
    }
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return this.prisma.game.update({
      where: { id },
      data: updateGameDto,
    });
  }

  remove(id: number) {
    return this.prisma.game.delete({
      where: { id },
    });
  }
}
