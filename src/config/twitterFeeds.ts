/**
 * Twitter Feed Configuration
 * Featured Twitter accounts for the Updates screen timeline display
 */

export interface FeaturedTwitterAccount {
  username: string; // Twitter username without @
  name: string;
  category: string;
}

export const FEATURED_TWITTER_ACCOUNTS: FeaturedTwitterAccount[] = [
  {
    username: 'lookonchain',
    name: 'Lookonchain',
    category: 'On-Chain Analysis',
  },
  {
    username: 'WhalePanda',
    name: 'Whale Panda',
    category: 'Whale Tracker',
  },
  {
    username: 'CryptoQuant_com',
    name: 'CryptoQuant',
    category: 'Market Analytics',
  },
  {
    username: 'glassnode',
    name: 'Glassnode',
    category: 'On-Chain Analytics',
  },
  {
    username: 'thekobeissiletter',
    name: 'The Kobeissi Letter',
    category: 'Market Intelligence',
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
