import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GameSearchResult, IMetadataProvider } from './metadata.interface';

@Injectable()
export class RawgProvider implements IMetadataProvider {
  private readonly logger = new Logger(RawgProvider.name);
  readonly source = 'rawg';
  readonly name = 'RAWG Video Games Database';

  private readonly apiKey = process.env.RAWG_API_KEY;

  async search(query: string): Promise<GameSearchResult[]> {
    if (!this.apiKey || !query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await axios.get('https://api.rawg.io/api/games', {
        params: {
          key: this.apiKey,
          search: query.trim(),
          page_size: 8,
        },
        timeout: 5000,
      });

      const results = response.data?.results;
      if (!Array.isArray(results)) {
        return [];
      }

      return results.map((item: any) => {
        const primaryPlatform =
          item.platforms?.[0]?.platform?.name || 'PC';
        return {
          id: item.id,
          title: item.name,
          platform: primaryPlatform,
          coverUrl: item.background_image || null,
          headerUrl: item.background_image || null,
          tinyImage: item.background_image || null,
          source: 'rawg',
          releaseDate: item.released,
          storeUrl: `https://rawg.io/games/${item.slug}`,
          platforms: {
            windows: item.platforms?.some((p: any) =>
              p.platform?.name?.toLowerCase().includes('pc'),
            ),
          },
        };
      });
    } catch (error) {
      this.logger.warn(`RAWG search failed for "${query}": ${error.message}`);
      return [];
    }
  }

  async getCover(title: string): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const results = await this.search(title);
      return results[0]?.coverUrl || null;
    } catch {
      return null;
    }
  }
}
