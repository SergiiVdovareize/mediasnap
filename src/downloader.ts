import { detectPlatform } from './detector';
import { DownloadResult, SupportedPlatform } from './types';

type ServiceFn = (url: string) => Promise<any>;

const serviceMap: Record<SupportedPlatform, ServiceFn> = {
  bluesky: (url) => require('../lib/services/blueskyService').fetchBlueskyMedia(url),
  capcut: (url) => require('../lib/services/capcutService').fetchCapcutData(url),
  dailymotion: (url) => require('../lib/services/dailymotionService').fetchDailymotionData(url),
  douyin: (url) => require('../lib/services/douyinService').fetchDouyinVideoInfo(url),
  facebook: (url) => require('../lib/services/facebookInstaService')(url),
  instagram: (url) => require('../lib/services/facebookInstaService')(url),
  kuaishou: (url) => require('../lib/services/kuaishouService').scrapeKuaishou(url),
  linkedin: (url) => require('../lib/services/linkedinService').fetchLinkedinData(url),
  pinterest: (url) => require('../lib/services/pinterestService').fetchPinterestMedia(url),
  reddit: (url) => require('../lib/services/redditService')(url),
  snapchat: (url) => require('../lib/services/snapchatService').fetchSnapchat(url),
  soundcloud: (url) => require('../lib/services/soundcloudService').fetchSoundcloudData(url),
  spotify: (url) => require('../lib/services/spotifyService').fetchSpotify(url),
  terabox: (url) => require('../lib/services/teraboxService').fetchTerabox(url),
  threads: (url) => require('../lib/services/threadsService')(url),
  tiktok: (url) => require('../lib/services/tiktokService').fetchTikTokData(url),
  tumblr: (url) => require('../lib/services/tumblrService').fetchTumblrData(url),
  twitter: (url) => require('../lib/services/twitterService').twitterDownloader(url),
  youtube: (url) => require('../lib/services/youtubeService').fetchYouTubeData(url),
};

export async function downloadMedia(url: string): Promise<DownloadResult> {
  const platform = detectPlatform(url);

  if (!platform) {
    return { success: false, platform: 'unknown', data: {}, error: `Unsupported URL: ${url}` };
  }

  const serviceFn = serviceMap[platform];
  if (!serviceFn) {
    return { success: false, platform, data: {}, error: `Service not implemented: ${platform}` };
  }

  try {
    const raw = await serviceFn(url);
    return { success: true, platform, data: raw as Record<string, unknown> };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, platform, data: {}, error: message };
  }
}
