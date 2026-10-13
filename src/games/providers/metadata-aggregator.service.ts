import { Injectable, Logger } from '@nestjs/common';
import { GameSearchResult } from './metadata.interface';
import { SteamProvider } from './steam.provider';
import { EpicGamesProvider } from './epic.provider';
import { NintendoProvider } from './nintendo.provider';
import { LauncherCatalogProvider } from './catalog.provider';
import { RawgProvider } from './rawg.provider';
import { calculateMatchScore } from './match-utils';

@Injectable()
export class MetadataAggregatorService {
  private readonly logger = new Logger(MetadataAggregatorService.name);

  constructor(
    private readonly steamProvider: SteamProvider,
    private readonly epicProvider: EpicGamesProvider,
    private readonly nintendoProvider: NintendoProvider,
    private readonly catalogProvider: LauncherCatalogProvider,
    private readonly rawgProvider: RawgProvider,
  ) {}

  async search(query: string, platformFilter?: string): Promise<GameSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim();
    const filter = platformFilter?.toLowerCase().trim();

    // If specific platform requested, target appropriate provider
    if (filter && filter !== 'all') {
      if (filter.includes('steam')) {
        const results = await this.steamProvider.search(trimmedQuery);
        return this.rankResults(results, trimmedQuery);
      }
      if (filter.includes('epic')) {
        const results = await this.epicProvider.search(trimmedQuery);
        return this.rankResults(results, trimmedQuery);
      }
      if (filter.includes('nintendo') || filter.includes('switch')) {
        const [catResults, ninResults] = await Promise.all([
          this.catalogProvider.search(trimmedQuery, 'nintendo'),
          this.nintendoProvider.search(trimmedQuery),
        ]);
        return this.rankAndDeduplicate([...catResults, ...ninResults], trimmedQuery);
      }
      if (
        filter.includes('riot') ||
        filter.includes('battle') ||
        filter.includes('ea') ||
        filter.includes('ubisoft') ||
        filter.includes('xbox') ||
        filter.includes('playstation')
      ) {
        const results = await this.catalogProvider.search(trimmedQuery, filter);
        return this.rankResults(results, trimmedQuery);
      }
    }

    // Universal / multi-platform search: query all providers concurrently
    const promises: Promise<GameSearchResult[]>[] = [
      this.catalogProvider.search(trimmedQuery),
      this.nintendoProvider.search(trimmedQuery),
      this.steamProvider.search(trimmedQuery),
      this.epicProvider.search(trimmedQuery),
    ];

    if (process.env.RAWG_API_KEY) {
      promises.push(this.rawgProvider.search(trimmedQuery));
    }

    const settled = await Promise.allSettled(promises);
    const combined: GameSearchResult[] = [];

    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        combined.push(...res.value);
      }
    }

    return this.rankAndDeduplicate(combined, trimmedQuery);
  }

  private rankResults(items: GameSearchResult[], query: string): GameSearchResult[] {
    return items
      .map((item) => ({
        item,
        score: calculateMatchScore(query, item.title) + (item.coverUrl ? 15 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .map((s) => s.item);
  }

  private rankAndDeduplicate(items: GameSearchResult[], query: string): GameSearchResult[] {
    const scored = items.map((item) => {
      let score = calculateMatchScore(query, item.title);
      if (item.coverUrl) score += 15;
      return { item, score };
    });

    // Ordenar de mayor a menor relevancia
    scored.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const uniqueResults: GameSearchResult[] = [];

    for (const { item } of scored) {
      const key = `${item.title.toLowerCase().trim()}|${item.platform.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(item);
      }
      if (uniqueResults.length >= 40) break;
    }

    return uniqueResults;
  }


  async getBestCover(
    title: string,
    platform?: string,
  ): Promise<{ url: string | null; source?: string }> {
    if (!title || title.trim().length === 0) {
      return { url: null };
    }

    const normPlatform = (platform || '').toLowerCase().trim();

    // Order providers according to preferred platform
    const providersInOrder: Array<{
      name: string;
      getCover: () => Promise<string | null>;
    }> = [];

    // Prioritized based on platform string
    if (
      normPlatform.includes('riot') ||
      normPlatform.includes('battle') ||
      normPlatform.includes('ea') ||
      normPlatform.includes('ubisoft')
    ) {
      providersInOrder.push({
        name: 'catalog',
        getCover: () => this.catalogProvider.getCover(title),
      });
    }

    if (normPlatform.includes('nintendo') || normPlatform.includes('switch')) {
      providersInOrder.push({
        name: 'nintendo',
        getCover: () => this.nintendoProvider.getCover(title),
      });
    }

    if (normPlatform.includes('epic')) {
      providersInOrder.push({
        name: 'epic',
        getCover: () => this.epicProvider.getCover(title),
      });
    }

    if (
      normPlatform.includes('steam') ||
      normPlatform.includes('pc') ||
      providersInOrder.length === 0
    ) {
      providersInOrder.push({
        name: 'steam',
        getCover: () => this.steamProvider.getCover(title),
      });
    }

    // Add remaining providers as fallback
    const namesAlready = new Set(providersInOrder.map((p) => p.name));

    if (!namesAlready.has('catalog')) {
      providersInOrder.push({
        name: 'catalog',
        getCover: () => this.catalogProvider.getCover(title),
      });
    }
    if (!namesAlready.has('steam')) {
      providersInOrder.push({
        name: 'steam',
        getCover: () => this.steamProvider.getCover(title),
      });
    }
    if (!namesAlready.has('epic')) {
      providersInOrder.push({
        name: 'epic',
        getCover: () => this.epicProvider.getCover(title),
      });
    }
    if (!namesAlready.has('nintendo')) {
      providersInOrder.push({
        name: 'nintendo',
        getCover: () => this.nintendoProvider.getCover(title),
      });
    }
    if (process.env.RAWG_API_KEY) {
      providersInOrder.push({
        name: 'rawg',
        getCover: () => this.rawgProvider.getCover(title),
      });
    }

    // Try sequentially until a valid cover is found
    for (const p of providersInOrder) {
      try {
        const cover = await p.getCover();
        if (cover) {
          return { url: cover, source: p.name };
        }
      } catch (err) {
        this.logger.debug(`Provider ${p.name} failed getCover for "${title}": ${err.message}`);
      }
    }

    return { url: null };
  }
}
