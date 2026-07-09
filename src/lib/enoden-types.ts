// Shared, type-only definitions imported by both api/enoden-schedule.ts (server)
// and the client (src/). Type-only cross-imports between api/ and src/ are erased
// at compile time, so this is safe despite the two being built by different
// toolchains (Vercel's function bundler vs. Vite).

export interface SocialPost {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface EnodenActiveTrain {
  tripId: string;
  direction: 1 | 2;
  prevStation: string;
  nextStation: string;
  fraction: number;
  isFinalLeg: boolean;
}

export interface EnodenScheduleResponse {
  generatedAt: string;
  serviceDate: string;
  trains: EnodenActiveTrain[];
}
