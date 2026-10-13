export interface GameSearchResult {
  id: string | number;
  title: string;
  platform: string;
  coverUrl: string | null;
  headerUrl?: string | null;
  tinyImage?: string | null;
  source: string;
  releaseDate?: string | null;
  storeUrl?: string | null;
  launcherUri?: string | null;
  platforms?: {
    windows?: boolean;
    mac?: boolean;
    linux?: boolean;
  };
}

export interface IMetadataProvider {
  readonly source: string;
  readonly name: string;
  search(query: string): Promise<GameSearchResult[]>;
  getCover(title: string): Promise<string | null>;
}
