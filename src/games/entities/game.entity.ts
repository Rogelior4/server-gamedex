import { GameStatus } from '@prisma/client';

export class Game {
  id: number;
  title: string;
  platform: string;
  coverUrl?: string | null;
  status: GameStatus;
  rating?: number | null;
  isFavorite: boolean;
  hoursPlayed?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
