import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GameSearchResult, IMetadataProvider } from './metadata.interface';

@Injectable()
export class EpicGamesProvider implements IMetadataProvider {
  private readonly logger = new Logger(EpicGamesProvider.name);
  readonly source = 'epic';
  readonly name = 'Epic Games';

  private readonly graphqlUrl = 'https://store.epicgames.com/graphql';

  async search(query: string): Promise<GameSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const graphqlQuery = `
      query searchStoreQuery($keywords: String, $count: Int, $country: String) {
        Catalog {
          searchStore(keywords: $keywords, count: $count, country: $country) {
            elements {
              id
              title
              productSlug
              urlSlug
              description
              keyImages {
                type
                url
              }
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post(
        this.graphqlUrl,
        {
          query: graphqlQuery,
          variables: {
            keywords: query.trim(),
            count: 8,
            country: 'US',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 6000,
        },
      );

      const elements =
        response.data?.data?.Catalog?.searchStore?.elements;
      if (!Array.isArray(elements)) {
        return [];
      }

      return elements.map((item: any) => {
        const images: Array<{ type: string; url: string }> = item.keyImages || [];
        
        // Find tall vertical cover art
        const tallImage = images.find(
          (img) =>
            img.type === 'OfferImageTall' ||
            img.type === 'DieselStoreFrontTall' ||
            img.type === 'Thumbnail' ||
            img.type === 'VaultClosed',
        );

        // Find wide header art
        const wideImage = images.find(
          (img) =>
            img.type === 'OfferImageWide' ||
            img.type === 'DieselStoreFrontWide' ||
            img.type === 'featuredMedia',
        );

        const coverUrl = tallImage?.url || wideImage?.url || null;
        const headerUrl = wideImage?.url || tallImage?.url || null;
        const slug = item.productSlug || item.urlSlug || item.id;

        return {
          id: item.id || slug,
          title: item.title,
          platform: 'Epic Games',
          coverUrl,
          headerUrl,
          tinyImage: coverUrl,
          source: 'epic',
          storeUrl: slug ? `https://store.epicgames.com/p/${slug}` : 'https://store.epicgames.com',
          launcherUri: `com.epicgames.launcher://apps/${item.id}?action=launch`,
          platforms: { windows: true },
        };
      });
    } catch (error) {
      this.logger.warn(`Epic Games search failed for "${query}": ${error.message}`);
      return [];
    }
  }

  async getCover(title: string): Promise<string | null> {
    try {
      const results = await this.search(title);
      if (results.length > 0 && results[0].coverUrl) {
        return results[0].coverUrl;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Epic Games getCover failed for "${title}": ${error.message}`);
      return null;
    }
  }
}
