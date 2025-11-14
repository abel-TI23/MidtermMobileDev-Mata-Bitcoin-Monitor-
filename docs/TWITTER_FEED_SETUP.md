# Twitter Feed Configuration Guide

## 📝 How to Update Featured Tweets

The app displays curated tweets from crypto experts on the Updates screen. Since we're using Twitter's official embed (not an API), you need to manually update tweet URLs.

### Quick Update Steps:

1. **Open Config File**
   ```
   src/config/twitterFeeds.ts
   ```

2. **Find Latest Tweet**
   - Go to Twitter/X (https://twitter.com)
   - Navigate to the account (e.g., @lookonchain)
   - Click on their latest tweet
   - Copy the URL from browser address bar

3. **Update Tweet URL**
   ```typescript
   {
     account: '@lookonchain',
     name: 'Lookonchain',
     tweetUrl: 'https://twitter.com/lookonchain/status/PASTE_NEW_ID_HERE',
     category: 'On-chain Analytics',
   }
   ```

4. **Reload App**
   - Save file
   - Reload React Native app (shake device → Reload)
   - Navigate to Updates → Twitter tab

### Example Tweet URL Format:
```
https://twitter.com/lookonchain/status/1856123456789012345
                   └─account─┘        └────tweet ID────┘
```

### Featured Accounts:

| Account | Focus | Category |
|---------|-------|----------|
| @lookonchain | Whale transactions, on-chain analytics | On-chain Analytics |
| @WhalePanda | Market insights, trading wisdom | Market Insights |
| @CryptoQuant_com | Exchange flows, derivatives data | Data Analytics |
| @glassnode | BTC/ETH on-chain metrics | On-chain Metrics |
| @santimentfeed | Social sentiment, behavior analytics | Behavior Analytics |

### Automation (Future):

To auto-fetch latest tweets, you would need:
- Twitter API v2 access (requires Developer Account)
- Bearer token authentication
- Implement timeline endpoint
- Store credentials securely

Current manual approach:
- ✅ No API limits
- ✅ No authentication needed
- ✅ Works instantly
- ⚠️ Requires manual updates (~1x per day)

### Best Practice:

- Update tweet URLs **once per day** (morning crypto hours)
- Keep tweets from **last 24 hours** for relevance
- Mix different account types (on-chain, macro, sentiment)
- Remove tweets older than 48 hours

---

**Questions?** Check the embedded tweet rendering in `src/components/TwitterEmbed.tsx`
