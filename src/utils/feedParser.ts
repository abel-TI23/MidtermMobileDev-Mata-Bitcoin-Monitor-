/**
 * RSS Feed Parser and Aggregator
 */

import { FeedItem, FeedSource } from '../types/feed';

// Cache for working Nitter instance (reuse for 5 minutes)
let cachedNitterInstance: { instance: string; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Parse RSS/XML feed from Nitter (Twitter alternative)
 */
export const fetchTwitterFeed = async (handle: string): Promise<FeedItem[]> => {
  try {
    // Using multiple Nitter instances as fallback (updated list - Nov 2025)
    const nitterInstances = [
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.cz',
      'https://nitter.net',
      'https://nitter.it',
      'https://nitter.unixfox.eu',
      'https://nitter.hu',
      'https://nitter.salastil.com',
      'https://nitter.fdn.fr',
      'https://nitter.1d4.us',
      'https://nitter.kavin.rocks',
      'https://nitter.nixnet.services',
    ];

    let feedData: string | null = null;
    let usedInstance = '';

    // Try cached instance first
    if (cachedNitterInstance && 
        Date.now() - cachedNitterInstance.timestamp < CACHE_DURATION) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`${cachedNitterInstance.instance}/${handle}/rss`, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          feedData = await response.text();
          usedInstance = cachedNitterInstance.instance;
          console.log(`✓ Twitter feed from cached instance: ${usedInstance}`);
        }
      } catch (err) {
        console.log('Cached instance failed, trying others...');
        cachedNitterInstance = null; // Clear cache
      }
    }

    // Try multiple Nitter instances with timeout if cache failed
    if (!feedData) {
      for (const instance of nitterInstances) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
          
          const response = await fetch(`${instance}/${handle}/rss`, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            feedData = await response.text();
            usedInstance = instance;
            // Cache the working instance
            cachedNitterInstance = { instance, timestamp: Date.now() };
            console.log(`✓ Twitter feed loaded from: ${instance}`);
            break;
          }
        } catch (err) {
          console.log(`✗ Failed to fetch from ${instance}`);
          continue; // Try next instance
        }
      }
    }

    if (!feedData) {
      console.warn(`All Nitter instances failed for @${handle}`);
      return []; // Return empty array instead of throwing
    }

    // Parse RSS XML
    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = feedData.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      
      const title = extractXmlTag(itemXml, 'title');
      const link = extractXmlTag(itemXml, 'link');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const description = extractXmlTag(itemXml, 'description');
      
      if (title && link && pubDate) {
        items.push({
          id: `twitter_${handle}_${link}`,
          source: 'twitter',
          author: handle,
          authorHandle: `@${handle}`,
          title: cleanHtml(title),
          content: description ? cleanHtml(description) : undefined,
          link: link.replace(usedInstance, 'https://twitter.com'),
          publishedAt: new Date(pubDate).getTime(),
        });
      }
    }

    return items.slice(0, 10); // Return latest 10 tweets
  } catch (error) {
    console.error(`Error fetching Twitter feed for ${handle}:`, error);
    return [];
  }
};

/**
 * Fetch news from The Block via RSS
 */
export const fetchTheBlockNews = async (): Promise<FeedItem[]> => {
  try {
    const response = await fetch('https://www.theblock.co/rss.xml');
    const feedData = await response.text();

    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = feedData.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      
      const title = extractXmlTag(itemXml, 'title');
      const link = extractXmlTag(itemXml, 'link');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const description = extractXmlTag(itemXml, 'description');
      const content = extractXmlTag(itemXml, 'content:encoded');
      
      // Extract image from content
      let imageUrl: string | undefined;
      const imgMatch = (content || description)?.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }

      if (title && link && pubDate) {
        items.push({
          id: `theblock_${link}`,
          source: 'news',
          author: 'The Block',
          title: cleanHtml(title),
          content: description ? cleanHtml(description) : undefined,
          link,
          imageUrl,
          publishedAt: new Date(pubDate).getTime(),
          category: 'News',
        });
      }
    }

    return items.slice(0, 10);
  } catch (error) {
    console.error('Error fetching The Block news:', error);
    return [];
  }
};

/**
 * Fetch news from CoinDesk via RSS
 */
export const fetchCoinDeskNews = async (): Promise<FeedItem[]> => {
  try {
    const response = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/');
    const feedData = await response.text();

    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = feedData.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      
      const title = extractXmlTag(itemXml, 'title');
      const link = extractXmlTag(itemXml, 'link');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const description = extractXmlTag(itemXml, 'description');
      
      let imageUrl: string | undefined;
      const imgMatch = description?.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }

      if (title && link && pubDate) {
        items.push({
          id: `coindesk_${link}`,
          source: 'news',
          author: 'CoinDesk',
          title: cleanHtml(title),
          content: description ? cleanHtml(description) : undefined,
          link,
          imageUrl,
          publishedAt: new Date(pubDate).getTime(),
          category: 'News',
        });
      }
    }

    return items.slice(0, 10);
  } catch (error) {
    console.error('Error fetching CoinDesk news:', error);
    return [];
  }
};

/**
 * Fetch news from Bloomberg Markets via RSS
 */
export const fetchBloombergNews = async (): Promise<FeedItem[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch('https://feeds.bloomberg.com/markets/news.rss', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn('Bloomberg RSS returned non-OK status:', response.status);
      return [];
    }
    
    const feedData = await response.text();
    
    if (!feedData || feedData.length < 100) {
      console.warn('Bloomberg RSS returned empty/invalid data');
      return [];
    }

    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = feedData.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      
      const title = extractXmlTag(itemXml, 'title');
      const link = extractXmlTag(itemXml, 'link');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const description = extractXmlTag(itemXml, 'description') || extractXmlTag(itemXml, 'content:encoded');
      
      // Extract image from media:content or enclosure
      let imageUrl: string | undefined;
      const mediaContentMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/i);
      if (mediaContentMatch) {
        imageUrl = mediaContentMatch[1];
      } else {
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i);
        if (enclosureMatch) {
          imageUrl = enclosureMatch[1];
        } else {
          // Try to extract from description HTML
          const imgMatch = description?.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }
      }

      if (title && link && pubDate) {
        items.push({
          id: `bloomberg_${link}`,
          source: 'news',
          author: 'Bloomberg Markets',
          title: cleanHtml(title),
          content: description ? cleanHtml(description).slice(0, 250) + '...' : 'Financial news and market analysis from Bloomberg.',
          link,
          imageUrl,
          publishedAt: new Date(pubDate).getTime(),
          category: 'Markets',
        });
      }
    }

    console.log(`✓ Bloomberg: loaded ${items.length} articles`);
    return items.slice(0, 10);
  } catch (error) {
    console.error('Error fetching Bloomberg news:', error);
    return [];
  }
};

/**
 * Fetch news from Coinvestasi via RSS
 */
export const fetchCoinvestasiNews = async (): Promise<FeedItem[]> => {
  try {
    const response = await fetch('https://coinvestasi.com/feed');
    const feedData = await response.text();

    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = feedData.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      
      const title = extractXmlTag(itemXml, 'title');
      const link = extractXmlTag(itemXml, 'link');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const description = extractXmlTag(itemXml, 'description');
      
      let imageUrl: string | undefined;
      const imgMatch = description?.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }

      if (title && link && pubDate) {
        items.push({
          id: `coinvestasi_${link}`,
          source: 'news',
          author: 'Coinvestasi',
          title: cleanHtml(title),
          content: description ? cleanHtml(description) : undefined,
          link,
          imageUrl,
          publishedAt: new Date(pubDate).getTime(),
          category: 'News',
        });
      }
    }

    return items.slice(0, 10);
  } catch (error) {
    console.error('Error fetching Coinvestasi news:', error);
    return [];
  }
};

/**
 * Fetch YouTube videos (1 latest video per channel, up to 6 channels total)
 */
export const fetchYouTubeFeed = async (channelId: string, channelName: string): Promise<FeedItem[]> => {
  try {
    // YouTube RSS feed format
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    );
    const feedData = await response.text();

    const items: FeedItem[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const matches = feedData.matchAll(entryRegex);

    for (const match of matches) {
      const entryXml = match[1];
      
      const videoId = extractXmlTag(entryXml, 'yt:videoId');
      const title = extractXmlTag(entryXml, 'title');
      const published = extractXmlTag(entryXml, 'published');
      const author = extractXmlTag(entryXml, 'name');
      
      if (videoId && title && published) {
        items.push({
          id: `youtube_${videoId}`,
          source: 'youtube',
          author: author || channelName,
          title: cleanHtml(title),
          link: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          publishedAt: new Date(published).getTime(),
          category: 'Video',
        });
      }
    }

    return items.slice(0, 1); // Return latest 1 video per channel (6 channels = 6 total videos)
  } catch (error) {
    console.error(`Error fetching YouTube feed for ${channelName}:`, error);
    return [];
  }
};

/**
 * Aggregate all feeds and sort by date
 * Improved error handling - continues even if some sources fail
 */
export const aggregateFeeds = async (
  twitterHandles: string[],
  youtubeChannels: { channelId: string; name: string }[],
  includeNews: boolean = true
): Promise<FeedItem[]> => {
  const allItems: FeedItem[] = [];
  let failedSources: string[] = [];

  // Fetch Twitter feeds (with individual error handling)
  const twitterPromises = twitterHandles.map(handle => 
    fetchTwitterFeed(handle).catch(err => {
      console.error(`Failed to fetch Twitter @${handle}:`, err.message);
      failedSources.push(`Twitter @${handle}`);
      return [];
    })
  );
  const twitterResults = await Promise.all(twitterPromises);
  twitterResults.forEach(items => allItems.push(...items));

  // Fetch News from multiple sources
  if (includeNews) {
    const newsPromises = [
      fetchTheBlockNews().catch(err => {
        console.error('Failed to fetch The Block:', err);
        failedSources.push('The Block');
        return [];
      }),
      fetchCoinDeskNews().catch(err => {
        console.error('Failed to fetch CoinDesk:', err);
        failedSources.push('CoinDesk');
        return [];
      }),
      fetchBloombergNews().catch(err => {
        console.error('Failed to fetch Bloomberg:', err);
        failedSources.push('Bloomberg');
        return [];
      }),
      fetchCoinvestasiNews().catch(err => {
        console.error('Failed to fetch Coinvestasi:', err);
        failedSources.push('Coinvestasi');
        return [];
      }),
    ];
    
    const newsResults = await Promise.all(newsPromises);
    newsResults.forEach(items => allItems.push(...items));
  }

  // Fetch YouTube feeds (with individual error handling)
  const youtubePromises = youtubeChannels.map(channel => 
    fetchYouTubeFeed(channel.channelId, channel.name).catch(err => {
      console.error(`Failed to fetch YouTube ${channel.name}:`, err.message);
      failedSources.push(`YouTube ${channel.name}`);
      return [];
    })
  );
  const youtubeResults = await Promise.all(youtubePromises);
  youtubeResults.forEach(items => allItems.push(...items));

  // Log summary
  if (failedSources.length > 0) {
    console.warn(`⚠️ Failed sources: ${failedSources.join(', ')}`);
  }
  console.log(`✓ Loaded ${allItems.length} items from ${
    twitterHandles.length + youtubeChannels.length + (includeNews ? 4 : 0) - failedSources.length
  } sources`);

  // Sort by published date (newest first)
  return allItems.sort((a, b) => b.publishedAt - a.publishedAt);
};

/**
 * Helper: Extract content from XML tag
 */
const extractXmlTag = (xml: string, tag: string): string | null => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
};

/**
 * Helper: Clean HTML entities and tags
 */
const cleanHtml = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};
