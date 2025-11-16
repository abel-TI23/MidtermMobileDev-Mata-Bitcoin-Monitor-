/**
 * Updates Feed Types
 */

export type FeedSource = 'twitter' | 'news' | 'youtube';

export interface FeedItem {
  id: string;
  source: FeedSource;
  author: string;
  authorHandle?: string; // Twitter handle or channel name
  title: string;
  content?: string;
  link: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  publishedAt: number;
  category?: string;
}

export interface TwitterAccount {
  handle: string;
  name: string;
  enabled: boolean;
}

export interface YouTubeChannel {
  channelId: string;
  name: string;
  enabled: boolean;
}

export const DEFAULT_TWITTER_ACCOUNTS: TwitterAccount[] = [
  // Whale trackers & on-chain analytics
  { handle: 'lookonchain', name: 'Lookonchain', enabled: true },
  { handle: 'WhalePanda', name: 'Whale Panda', enabled: true },
  { handle: 'CryptoQuant_com', name: 'CryptoQuant', enabled: true },
  { handle: 'glassnode', name: 'Glassnode', enabled: true },
  
  // Market intelligence & newsletters
  { handle: 'thekobeissiletter', name: 'The Kobeissi Letter', enabled: true },
  { handle: 'santimentfeed', name: 'Santiment', enabled: true },
  { handle: 'MilkRoadDaily', name: 'Milk Road', enabled: true },
  
  // Institutional tracking
  { handle: 'arkhamintel', name: 'Arkham Intel', enabled: true },
];

export const DEFAULT_YOUTUBE_CHANNELS: YouTubeChannel[] = [
  { channelId: 'UCOHxDwCcOzBaLkeTazanwcw', name: 'Bravos Research', enabled: true },
  { channelId: 'UCtOV5M-T3GcsJAq8QKaf0lg', name: 'Bitcoin Magazine', enabled: true },
  { channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg', name: 'Bloomberg Television', enabled: true },
  { channelId: 'UCBH5VZE_Y4F3CMcPIzPEB5A', name: 'Real Vision', enabled: true },
];
