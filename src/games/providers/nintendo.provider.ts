import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GameSearchResult, IMetadataProvider } from './metadata.interface';
import { calculateMatchScore } from './match-utils';

@Injectable()
export class NintendoProvider implements IMetadataProvider {
  private readonly logger = new Logger(NintendoProvider.name);
  readonly source = 'nintendo';
  readonly name = 'Nintendo';

  private readonly algoliaUrl =
    'https://U3B6GR4UA3-1.algolianet.com/1/indexes/*/queries';
  private readonly appId = 'U3B6GR4UA3';
  private readonly apiKey = 'c4da8be7fd29f0f5bfa42920b0a99dc7';

  private resolvePlatform(hit: any, title: string): string {
    // 1. Extraer plataforma directa del hit de Algolia si existe
    const raw =
      (Array.isArray(hit.platform) ? hit.platform[0] : hit.platform) ||
      (Array.isArray(hit.corePlatforms) ? hit.corePlatforms[0] : hit.corePlatforms) ||
      hit.system ||
      hit.hardware;

    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
      const lower = raw.toLowerCase();
      if (lower.includes('ds') && !lower.includes('3ds')) return 'Nintendo DS';
      if (lower.includes('3ds')) return 'Nintendo 3DS';
      if (lower.includes('switch')) return 'Nintendo Switch';
      if (lower.includes('wii u')) return 'Wii U';
      if (lower.includes('wii')) return 'Wii';
      if (lower.includes('gamecube')) return 'GameCube';
      if (lower.includes('advance') || lower.includes('gba')) return 'Game Boy Advance';
      if (lower.includes('game boy')) return 'Game Boy';
      if (lower.includes('64') || lower.includes('n64')) return 'Nintendo 64';
      if (lower.includes('snes')) return 'Super Nintendo (SNES)';
      if (lower.includes('nes')) return 'NES';
      return raw;
    }

    // 2. Heurística inteligente por título para clásicos conocidos
    const t = (title || '').toLowerCase();
    if (
      t.includes('spirit tracks') ||
      t.includes('phantom hourglass') ||
      t.includes('mario kart ds') ||
      t.includes('super mario 64 ds') ||
      t.includes('new super mario bros.') ||
      t.includes('pokemon platinum') ||
      t.includes('heartgold') ||
      t.includes('soulsilver') ||
      t.includes('black and white') ||
      t.includes('black 2') ||
      t.includes('white 2') ||
      t.includes('diamond and pearl') ||
      t.includes('partners in time') ||
      t.includes('bowser\'s inside story')
    ) {
      return 'Nintendo DS';
    }

    if (
      t.includes('a link between worlds') ||
      t.includes('ocarina of time 3d') ||
      t.includes('majora\'s mask 3d') ||
      t.includes('sun and moon') ||
      t.includes('ultra sun') ||
      t.includes('ultra moon') ||
      t.includes('omega ruby') ||
      t.includes('alpha sapphire') ||
      t.includes('super mario 3d land')
    ) {
      return 'Nintendo 3DS';
    }

    if (
      t.includes('wind waker hd') ||
      t.includes('twilight princess hd') ||
      t.includes('super mario 3d world')
    ) {
      return 'Wii U';
    }

    if (
      t.includes('wind waker') ||
      t.includes('super smash bros. melee') ||
      t.includes('super mario sunshine')
    ) {
      return 'GameCube';
    }

    if (
      t.includes('ocarina of time') ||
      t.includes('majora\'s mask') ||
      t.includes('super mario 64')
    ) {
      return 'Nintendo 64';
    }

    return 'Nintendo Switch';
  }

  async search(query: string): Promise<GameSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const cleanQ = query.trim().replace(/[™®©]/g, '');
      const response = await axios.post(
        this.algoliaUrl,
        {
          requests: [
            {
              indexName: 'ncom_game_en_us',
              params: `query=${encodeURIComponent(cleanQ)}&hitsPerPage=30&typoTolerance=true&removeWordsIfNoResults=allOptional`,
            },
          ],
        },
        {
          headers: {
            'X-Algolia-Application-Id': this.appId,
            'X-Algolia-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      const hits = response.data?.results?.[0]?.hits;
      if (!Array.isArray(hits)) {
        return [];
      }

      const scored = hits.map((hit: any) => {
        // Prefer official boxart, fallback to horizontal header
        const coverUrl = hit.boxart || hit.horizontalHeaderImage || null;
        const headerUrl = hit.horizontalHeaderImage || hit.boxart || null;
        const slug = hit.slug;
        const platform = this.resolvePlatform(hit, hit.title);
        const score = calculateMatchScore(query, hit.title);

        const result: GameSearchResult = {
          id: hit.objectID || slug || hit.title,
          title: hit.title,
          platform,
          coverUrl,
          headerUrl,
          tinyImage: coverUrl,
          source: 'nintendo',
          releaseDate: hit.releaseDate,
          storeUrl: slug
            ? `https://www.nintendo.com/store/products/${slug}`
            : `https://www.nintendo.com/search/#q=${encodeURIComponent(hit.title)}`,
          launcherUri: null,
          platforms: { windows: false },
        };

        return { result, score };
      });

      // Ordenar por relevancia calculada con tolerancia a typos
      scored.sort((a, b) => b.score - a.score);

      return scored.map((s) => s.result);
    } catch (error) {
      this.logger.warn(`Nintendo search failed for "${query}": ${error.message}`);
      return [];
    }
  }

  async getCover(title: string): Promise<string | null> {
    try {
      const results = await this.search(title);
      for (const res of results) {
        if (res.coverUrl) {
          return res.coverUrl;
        }
      }
      return null;
    } catch (error) {
      this.logger.warn(`Nintendo getCover failed for "${title}": ${error.message}`);
      return null;
    }
  }
}

