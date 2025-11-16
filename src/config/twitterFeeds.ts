/**
 * Twitter Feed Configuration
 * Featured Twitter accounts for the Updates screen timeline display
 */

export interface FeaturedTwitterAccount {
  username: string; // Twitter username without @
  name: string;
  category: string;
  description?: string;
}

export const FEATURED_TWITTER_ACCOUNTS: FeaturedTwitterAccount[] = [
  {
    username: 'lookonchain',
    name: 'Lookonchain',
    category: 'On-Chain Analysis',
    description: 'Mengulas pergerakan dompet besar dan alur smart money secara real-time.',
  },
  {
    username: 'WhalePanda',
    name: 'Whale Panda',
    category: 'Whale Tracker',
    description: 'Trader lama dengan insight makro dan pergerakan paus yang penting.',
  },
  {
    username: 'CryptoQuant_com',
    name: 'CryptoQuant',
    category: 'Market Analytics',
    description: 'Platform data yang membahas arus exchange, miner, dan indikator on-chain.',
  },
  {
    username: 'glassnode',
    name: 'Glassnode',
    category: 'On-Chain Analytics',
    description: 'Riset mendalam tentang metrik jaringan dan tren pasar kripto.',
  },
  {
    username: 'thekobeissiletter',
    name: 'The Kobeissi Letter',
    category: 'Market Intelligence',
    description: 'Analisis makro lintas komoditas, ekuitas, dan implikasi untuk kripto.',
  },
];

// Legacy interface - kept for backward compatibility
export interface FeaturedTweet {
  account: string;
  name: string;
  tweetUrl: string;
  category: string;
}

// Legacy export - kept for backward compatibility
export const FEATURED_TWEETS: FeaturedTweet[] = FEATURED_TWITTER_ACCOUNTS.map(account => ({
  account: `@${account.username}`,
  name: account.name,
  tweetUrl: `https://twitter.com/${account.username}`,
  category: account.category,
}));
