import { detectPlatform } from './detector';
import { DownloadResult, SupportedPlatform } from './types';

type ServiceFn = (url: string) => Promise<any>;

const serviceMap: Record<SupportedPlatform, ServiceFn> = {
  bluesky: (url) => require('../upstream/services/blueskyService').fetchBlueskyMedia(url),
  capcut: (url) => require('../upstream/services/capcutService').fetchCapcutData(url),
  dailymotion: (url) => require('../upstream/services/dailymotionService').fetchDailymotionData(url),
  douyin: (url) => require('../upstream/services/douyinService').fetchDouyinVideoInfo(url),
  facebook: (url) => require('../upstream/services/facebookInstaService')(url),
  instagram: (url) => require('../upstream/services/facebookInstaService')(url),
  kuaishou: (url) => require('../upstream/services/kuaishouService').scrapeKuaishou(url),
  linkedin: (url) => require('../upstream/services/linkedinService').fetchLinkedinData(url),
  pinterest: (url) => require('../upstream/services/pinterestService').fetchPinterestMedia(url),
  reddit: (url) => require('../upstream/services/redditService')(url),
  snapchat: (url) => require('../upstream/services/snapchatService').fetchSnapchat(url),
  soundcloud: (url) => require('../upstream/services/soundcloudService').fetchSoundcloudData(url),
  spotify: (url) => require('../upstream/services/spotifyService').fetchSpotify(url),
  terabox: (url) => require('../upstream/services/teraboxService').fetchTerabox(url),
  threads: (url) => require('../upstream/services/threadsService')(url),
  tiktok: (url) => require('../upstream/services/tiktokService').fetchTikTokData(url),
  tumblr: (url) => require('../upstream/services/tumblrService').fetchTumblrData(url),
  twitter: (url) => require('../upstream/services/twitterService').twitterDownloader(url),
  youtube: (url) => require('../upstream/services/youtubeService').fetchYouTubeData(url),
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
