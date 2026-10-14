import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ImportSteamGamesDto } from './dto/import-steam.dto';
import { GameStatus } from '@prisma/client';

export interface SteamProfileSummary {
  steamId: string;
  personaName: string;
  avatar: string;
  profileUrl: string;
  isPublic: boolean;
}

export interface SteamOwnedGame {
  appId: number;
  title: string;
  platform: string;
  coverUrl: string;
  headerUrl: string;
  hoursPlayed: number;
  playtimeMinutes: number;
  rtimeLastPlayed: number;
  suggestedStatus: GameStatus;
}

@Injectable()
export class SteamAccountService {
  private readonly logger = new Logger(SteamAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtiene la API Key de Steam activa (desde parámetro o variable de entorno)
   */
  private getApiKey(explicitKey?: string): string {
    const key =
      explicitKey?.trim() ||
      this.configService.get<string>('STEAM_API_KEY')?.trim() ||
      process.env.STEAM_API_KEY?.trim();

    if (!key) {
      throw new BadRequestException(
        'Se requiere una Steam Web API Key para consultar la biblioteca de Steam. ' +
        'Puedes configurarla en el archivo .env del servidor (STEAM_API_KEY=tu_clave) ' +
        'o ingresarla directamente en la ventana de sincronización. ' +
        'Obtén una gratis en: https://steamcommunity.com/dev/apikey',
      );
    }

    return key;
  }

  /**
   * Extrae el identificador limpio a partir de una URL o texto de entrada
   */
  private cleanIdentifier(input: string): { isSteamId: boolean; value: string } {
    let cleaned = input.trim();

    // Eliminar barras finales
    cleaned = cleaned.replace(/\/+$/, '');

    // Si es una URL completa de tipo /profiles/7656119...
    const profileMatch = cleaned.match(/steamcommunity\.com\/profiles\/(\d{15,20})/i);
    if (profileMatch) {
      return { isSteamId: true, value: profileMatch[1] };
    }

    // Si es una URL completa de tipo /id/custom_name
    const vanityMatch = cleaned.match(/steamcommunity\.com\/id\/([^/?#]+)/i);
    if (vanityMatch) {
      return { isSteamId: false, value: vanityMatch[1] };
    }

    // Si es solo una cadena numérica de 15 a 20 dígitos (SteamID64)
    if (/^\d{15,20}$/.test(cleaned)) {
      return { isSteamId: true, value: cleaned };
    }

    // De lo contrario asumimos que es un nombre de usuario personalizado (Vanity URL)
    return { isSteamId: false, value: cleaned };
  }

  /**
   * Resuelve el nombre de usuario de Steam o SteamID y retorna el perfil público
   */
  async resolveUser(
    identifier: string,
    apiKeyParam?: string,
  ): Promise<SteamProfileSummary> {
    if (!identifier || identifier.trim().length === 0) {
      throw new BadRequestException('Debes proporcionar un usuario o enlace de Steam');
    }

    const apiKey = this.getApiKey(apiKeyParam);
    const parsed = this.cleanIdentifier(identifier);
    let steamId = parsed.value;

    // Si no es un SteamID numérico directo, resolvemos la Vanity URL
    if (!parsed.isSteamId) {
      try {
        const res = await axios.get(
          `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`,
          {
            params: {
              key: apiKey,
              vanityurl: parsed.value,
            },
            timeout: 7000,
          },
        );

        if (res.data?.response?.success !== 1 || !res.data?.response?.steamid) {
          throw new NotFoundException(
            `No se encontró ninguna cuenta de Steam para el usuario "${parsed.value}". ` +
            'Verifica que el nombre o enlace sea el correcto.',
          );
        }

        steamId = res.data.response.steamid;
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        this.logger.warn(`ResolveVanityURL failed: ${error.message}`);
        throw new BadRequestException(
          `Error al conectar con la API de Steam: ${error.response?.data?.message || error.message}`,
        );
      }
    }

    // Consultamos los datos públicos del jugador (Avatar, nombre de perfil, privacidad)
    try {
      const summaryRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: apiKey,
            steamids: steamId,
          },
          timeout: 7000,
        },
      );

      const player = summaryRes.data?.response?.players?.[0];
      if (!player) {
        throw new NotFoundException(`No se encontró el perfil para SteamID ${steamId}`);
      }

      const isPublic = player.communityvisibilitystate === 3;

      return {
        steamId,
        personaName: player.personaname || parsed.value,
        avatar: player.avatarfull || player.avatarmedium || player.avatar || '',
        profileUrl: player.profileurl || `https://steamcommunity.com/profiles/${steamId}`,
        isPublic,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`GetPlayerSummaries failed: ${error.message}`);
      throw new BadRequestException(`No se pudo obtener el perfil de Steam: ${error.message}`);
    }
  }

  /**
   * Obtiene la lista completa de videojuegos que posee el usuario en Steam
   */
  async getOwnedGames(
    steamId: string,
    apiKeyParam?: string,
  ): Promise<{ totalCount: number; isPublic: boolean; games: SteamOwnedGame[] }> {
    if (!steamId || !/^\d{15,20}$/.test(steamId.trim())) {
      throw new BadRequestException('Se requiere un SteamID64 numérico válido');
    }

    const apiKey = this.getApiKey(apiKeyParam);

    try {
      const response = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
        {
          params: {
            key: apiKey,
            steamid: steamId.trim(),
            include_appinfo: 1,
            include_played_free_games: 1,
            format: 'json',
          },
          timeout: 10000,
        },
      );

      const rawGames = response.data?.response?.games;
      const gameCount = response.data?.response?.game_count ?? 0;

      // Si la lista de juegos es indefinida pero la llamada tuvo éxito, la cuenta tiene sus juegos en privado
      if (!rawGames && gameCount === 0) {
        return {
          totalCount: 0,
          isPublic: false,
          games: [],
        };
      }

      if (!Array.isArray(rawGames)) {
        return {
          totalCount: 0,
          isPublic: false,
          games: [],
        };
      }

      const games: SteamOwnedGame[] = rawGames.map((item: any) => {
        const appId = Number(item.appid);
        const playtimeMinutes = item.playtime_forever || 0;
        const hoursPlayed = Math.round(playtimeMinutes / 60);

        let suggestedStatus: GameStatus = GameStatus.BACKLOG;
        if (hoursPlayed >= 25) {
          suggestedStatus = GameStatus.COMPLETED;
        } else if (hoursPlayed > 0) {
          suggestedStatus = GameStatus.PLAYING;
        }

        return {
          appId,
          title: item.name,
          platform: 'Steam',
          coverUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`,
          headerUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
          hoursPlayed,
          playtimeMinutes,
          rtimeLastPlayed: item.rtime_last_played || 0,
          suggestedStatus,
        };
      });

      // Ordenar: primero los más jugados
      games.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

      return {
        totalCount: games.length,
        isPublic: true,
        games,
      };
    } catch (error) {
      this.logger.error(`GetOwnedGames failed: ${error.message}`);
      throw new BadRequestException(
        'No se pudo consultar la lista de juegos de Steam. ' +
        'Asegúrate de que en la Configuración de Privacidad de tu cuenta de Steam, ' +
        'la opción "Detalles de los juegos" esté marcada como "Público".',
      );
    }
  }

  /**
   * Importa una selección de juegos de Steam a la base de datos de GameDex,
   * evitando duplicar juegos ya registrados y opcionalmente sincronizando horas.
   */
  async importGames(dto: ImportSteamGamesDto) {
    if (!dto.games || dto.games.length === 0) {
      return { imported: 0, updated: 0, skipped: 0, total: 0 };
    }

    // Traemos todos los juegos existentes para checar duplicados
    const existingGames = await this.prisma.game.findMany({
      select: {
        id: true,
        title: true,
        platform: true,
        hoursPlayed: true,
        coverUrl: true,
      },
    });

    // Mapeo normalizado para búsqueda rápida
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const existingMap = new Map<string, (typeof existingGames)[0]>();
    for (const g of existingGames) {
      existingMap.set(normalize(g.title), g);
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of dto.games) {
      const norm = normalize(item.title);
      const existing = existingMap.get(norm);

      if (existing) {
        if (dto.updateExistingHours) {
          const newHours = item.hoursPlayed ?? 0;
          const currentHours = existing.hoursPlayed ?? 0;
          const needsHourUpdate = newHours > currentHours;
          const needsCover = !existing.coverUrl && !!item.coverUrl;

          if (needsHourUpdate || needsCover) {
            await this.prisma.game.update({
              where: { id: existing.id },
              data: {
                ...(needsHourUpdate ? { hoursPlayed: newHours } : {}),
                ...(needsCover ? { coverUrl: item.coverUrl } : {}),
              },
            });
            updatedCount++;
            continue;
          }
        }
        skippedCount++;
        continue;
      }

      // Juego nuevo: insertamos en PostgreSQL
      const hours = item.hoursPlayed ?? 0;
      let status = item.status;
      if (!status) {
        if (hours >= 25) {
          status = GameStatus.COMPLETED;
        } else if (hours > 0) {
          status = GameStatus.PLAYING;
        } else {
          status = GameStatus.BACKLOG;
        }
      }

      await this.prisma.game.create({
        data: {
          title: item.title,
          platform: 'Steam',
          coverUrl: item.coverUrl || null,
          status,
          hoursPlayed: hours,
          isFavorite: false,
          notes: item.appId ? `Steam AppID: ${item.appId}` : null,
        },
      });

      importedCount++;
      // Lo añadimos al map para evitar duplicados dentro del mismo lote
      existingMap.set(norm, {
        id: -1,
        title: item.title,
        platform: 'Steam',
        hoursPlayed: hours,
        coverUrl: item.coverUrl || null,
      });
    }

    return {
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: dto.games.length,
    };
  }
}
