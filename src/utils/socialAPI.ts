/**
 * Social Sentiment API Integration
 * 
 * Uses CryptoPanic API for crypto news and sentiment
 * Free tier: 500 calls/day (we use ~48 calls/day = every 30 minutes)
 */

import { cryptoPanicCache } from './cacheManager';

// CryptoPanic API configuration
const CRYPTOPANIC_API_KEY = 'f1659c55f83d7c3aa5c6731a336a4ac0b0f7f556';
const CRYPTOPANIC_BASE_URL = 'https://cryptopanic.com/api/developer/v2';

/**
 * News post data
 */
export interface NewsPost {
  id: number;
  title: string;
  published_at: string;
  url: string;
  source: {
    title: string;
    domain: string;
  };
  currencies: Array<{
    code: string;
    title: string;
  }>;
  kind: 'news' | 'media';
  votes: {
    positive: number;
    negative: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
    comments: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Social sentiment summary
 */
export interface SocialSentiment {
  posts: NewsPost[];
  sentiment: {
    positive: number; // Percentage
    negative: number; // Percentage
    neutral: number; // Percentage
    overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  timestamp: number;
  topPosts: NewsPost[]; // Most important posts
}

/**
 * Calculate sentiment from vote data
 */
function calculateSentiment(votes: NewsPost['votes']): 'positive' | 'negative' | 'neutral' {
  const positiveScore = votes.positive + votes.liked;
  const negativeScore = votes.negative + votes.disliked + votes.toxic;
  
  if (positiveScore > negativeScore * 1.5) {
    return 'positive';
  } else if (negativeScore > positiveScore * 1.5) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

/**
 * Fetch Bitcoin news and sentiment
 * @param limit Number of posts to fetch (default: 20)
 */
export async function fetchBitcoinSentiment(limit: number = 20): Promise<SocialSentiment> {
  const result = await cryptoPanicCache.get(async () => {
    const timeout = 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Fetch Bitcoin-related news (API v2 format)
      const url = `${CRYPTOPANIC_BASE_URL}/posts/?auth_token=${CRYPTOPANIC_API_KEY}&currencies=BTC&kind=news&public=true`;
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from CryptoPanic');
      }
      
      // Parse posts and calculate sentiment
      const posts: NewsPost[] = data.results.slice(0, limit).map((post: any) => {
        const sentiment = calculateSentiment(post.votes);
        
        return {
          id: post.id,
          title: post.title,
          published_at: post.published_at,
          url: post.url,
          source: {
            title: post.source?.title || 'Unknown',
            domain: post.source?.domain || '',
          },
          currencies: post.currencies || [],
          kind: post.kind,
          votes: {
            positive: post.votes?.positive || 0,
            negative: post.votes?.negative || 0,
            important: post.votes?.important || 0,
            liked: post.votes?.liked || 0,
            disliked: post.votes?.disliked || 0,
            lol: post.votes?.lol || 0,
            toxic: post.votes?.toxic || 0,
            saved: post.votes?.saved || 0,
            comments: post.votes?.comments || 0,
          },
          sentiment,
        };
      });
      
      // Calculate overall sentiment
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      
      posts.forEach(post => {
        if (post.sentiment === 'positive') positiveCount++;
        else if (post.sentiment === 'negative') negativeCount++;
        else neutralCount++;
      });
      
      const total = posts.length || 1;
      const positivePercentage = (positiveCount / total) * 100;
      const negativePercentage = (negativeCount / total) * 100;
      const neutralPercentage = (neutralCount / total) * 100;
      
      let overall: SocialSentiment['sentiment']['overall'];
      if (positivePercentage > 50) {
        overall = 'BULLISH';
      } else if (negativePercentage > 50) {
        overall = 'BEARISH';
      } else {
        overall = 'NEUTRAL';
      }
      
      // Get top posts (sorted by importance)
      const topPosts = [...posts]
        .sort((a, b) => b.votes.important - a.votes.important)
        .slice(0, 5);
      
      return {
        posts,
        sentiment: {
          positive: Math.round(positivePercentage),
          negative: Math.round(negativePercentage),
          neutral: Math.round(neutralPercentage),
          overall,
        },
        timestamp: Date.now(),
        topPosts,
      };
    } catch (error) {
      console.error('❌ Failed to fetch Bitcoin sentiment:', error);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  });
  return result as SocialSentiment;
}

/**
 * Fetch trending crypto topics (not Bitcoin-specific)
 * @param limit Number of posts to fetch (default: 10)
 */
export async function fetchTrendingNews(limit: number = 10): Promise<NewsPost[]> {
  const timeout = 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Fetch trending posts (all cryptocurrencies) - API v2
    const url = `${CRYPTOPANIC_BASE_URL}/posts/?auth_token=${CRYPTOPANIC_API_KEY}&filter=trending&public=true`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from CryptoPanic');
    }
    
    return data.results.slice(0, limit).map((post: any) => ({
      id: post.id,
      title: post.title,
      published_at: post.published_at,
      url: post.url,
      source: {
        title: post.source?.title || 'Unknown',
        domain: post.source?.domain || '',
      },
      currencies: post.currencies || [],
      kind: post.kind,
      votes: post.votes || {},
      sentiment: calculateSentiment(post.votes),
    }));
  } catch (error) {
    console.error('❌ Failed to fetch trending news:', error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Format time ago (e.g., "2 hours ago")
 */
export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffMs = now.getTime() - postTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return postTime.toLocaleDateString();
}

/**
 * Get emoji for sentiment
 */
export function getSentimentEmoji(sentiment: 'positive' | 'negative' | 'neutral'): string {
  switch (sentiment) {
    case 'positive':
      return '📈';
    case 'negative':
      return '📉';
    case 'neutral':
      return '📊';
  }
}

/**
 * Get color for sentiment
 */
export function getSentimentColor(sentiment: 'positive' | 'negative' | 'neutral'): string {
  switch (sentiment) {
    case 'positive':
      return '#10B981'; // Green
    case 'negative':
      return '#EF4444'; // Red
    case 'neutral':
      return '#6B7280'; // Gray
  }
}
