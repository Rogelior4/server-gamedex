import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GameSearchResult, IMetadataProvider } from './metadata.interface';

@Injectable()
export class SteamProvider implements IMetadataProvider {
  private readonly logger = new Logger(SteamProvider.name);
  readonly source = 'steam';
  readonly name = 'Steam';

  async search(query: string): Promise<GameSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query.trim())}&l=english&cc=US`,
        { timeout: 5000 },
      );

      if (!response.data?.items || !Array.isArray(response.data.items)) {
        return [];
      }

      return response.data.items.slice(0, 8).map((item: any) => {
        const appId = item.id;
        const libraryCoverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
        const headerUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

        return {
          id: appId,
          title: item.name,
          platform: 'Steam',
          coverUrl: libraryCoverUrl,
          headerUrl: headerUrl,
          tinyImage: item.tiny_image || headerUrl,
          source: 'steam',
          storeUrl: `https://store.steampowered.com/app/${appId}`,
          launcherUri: `steam://run/${appId}`,
          platforms: item.platforms || { windows: true },
        };
      });
    } catch (error) {
      this.logger.warn(`Steam search failed for "${query}": ${error.message}`);
      return [];
    }
  }

  async getCover(title: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`,
        { timeout: 5000 },
      );

      if (response.data?.items && response.data.items.length > 0) {
        for (const item of response.data.items.slice(0, 3)) {
          const appId = item.id;
          const modernUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
          try {
            const check = await axios.head(modernUrl, { timeout: 3000 });
            if (check.status === 200) {
              return modernUrl;
            }
          } catch {
            const legacyUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;
            try {
              const checkLegacy = await axios.head(legacyUrl, { timeout: 3000 });
              if (checkLegacy.status === 200) {
                return legacyUrl;
              }
            } catch {}
          }
        }

        const topId = response.data.items[0].id;
        return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${topId}/header.jpg`;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Steam getCover failed for "${title}": ${error.message}`);
      return null;
    }
  }
}
