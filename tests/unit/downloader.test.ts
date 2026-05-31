import { downloadMedia } from '../../src/downloader';
import { detectPlatform } from '../../src/detector';
import { SupportedPlatform } from '../../src/types';

// Mock the detector module
jest.mock('../../src/detector', () => ({
  detectPlatform: jest.fn(),
}));

// Mock all 18 upstream services according to their specific exports
jest.mock('../../lib/services/blueskyService', () => ({ fetchBlueskyMedia: jest.fn() }));
jest.mock('../../lib/services/capcutService', () => ({ fetchCapcutData: jest.fn() }));
jest.mock('../../lib/services/dailymotionService', () => ({ fetchDailymotionData: jest.fn() }));
jest.mock('../../lib/services/douyinService', () => ({ fetchDouyinVideoInfo: jest.fn() }));
jest.mock('../../lib/services/facebookInstaService', () => jest.fn());
jest.mock('../../lib/services/kuaishouService', () => ({ scrapeKuaishou: jest.fn() }));
jest.mock('../../lib/services/linkedinService', () => ({ fetchLinkedinData: jest.fn() }));
jest.mock('../../lib/services/pinterestService', () => ({ fetchPinterestMedia: jest.fn() }));
jest.mock('../../lib/services/redditService', () => jest.fn());
jest.mock('../../lib/services/snapchatService', () => ({ fetchSnapchat: jest.fn() }));
jest.mock('../../lib/services/soundcloudService', () => ({ fetchSoundcloudData: jest.fn() }));
jest.mock('../../lib/services/spotifyService', () => ({ fetchSpotify: jest.fn() }));
jest.mock('../../lib/services/teraboxService', () => ({ fetchTerabox: jest.fn() }));
jest.mock('../../lib/services/threadsService', () => jest.fn());
jest.mock('../../lib/services/tiktokService', () => ({ fetchTikTokData: jest.fn() }));
jest.mock('../../lib/services/tumblrService', () => ({ fetchTumblrData: jest.fn() }));
jest.mock('../../lib/services/twitterService', () => ({ twitterDownloader: jest.fn() }));
jest.mock('../../lib/services/youtubeService', () => ({ fetchYouTubeData: jest.fn() }));

const mockDetect = detectPlatform as jest.Mock;

describe('downloadMedia()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const platformMockDetails: Array<{
    platform: SupportedPlatform;
    modulePath: string;
    funcName?: string;
    mockResult: any;
  }> = [
    { platform: 'bluesky', modulePath: 'blueskyService', funcName: 'fetchBlueskyMedia', mockResult: { mock: 'bluesky' } },
    { platform: 'capcut', modulePath: 'capcutService', funcName: 'fetchCapcutData', mockResult: { mock: 'capcut' } },
    { platform: 'dailymotion', modulePath: 'dailymotionService', funcName: 'fetchDailymotionData', mockResult: { mock: 'dailymotion' } },
    { platform: 'douyin', modulePath: 'douyinService', funcName: 'fetchDouyinVideoInfo', mockResult: { mock: 'douyin' } },
    { platform: 'facebook', modulePath: 'facebookInstaService', mockResult: { mock: 'facebook' } },
    { platform: 'instagram', modulePath: 'facebookInstaService', mockResult: { mock: 'instagram' } },
    { platform: 'kuaishou', modulePath: 'kuaishouService', funcName: 'scrapeKuaishou', mockResult: { mock: 'kuaishou' } },
    { platform: 'linkedin', modulePath: 'linkedinService', funcName: 'fetchLinkedinData', mockResult: { mock: 'linkedin' } },
    { platform: 'pinterest', modulePath: 'pinterestService', funcName: 'fetchPinterestMedia', mockResult: { mock: 'pinterest' } },
    { platform: 'reddit', modulePath: 'redditService', mockResult: { mock: 'reddit' } },
    { platform: 'snapchat', modulePath: 'snapchatService', funcName: 'fetchSnapchat', mockResult: { mock: 'snapchat' } },
    { platform: 'soundcloud', modulePath: 'soundcloudService', funcName: 'fetchSoundcloudData', mockResult: { mock: 'soundcloud' } },
    { platform: 'spotify', modulePath: 'spotifyService', funcName: 'fetchSpotify', mockResult: { mock: 'spotify' } },
    { platform: 'terabox', modulePath: 'teraboxService', funcName: 'fetchTerabox', mockResult: { mock: 'terabox' } },
    { platform: 'threads', modulePath: 'threadsService', mockResult: { mock: 'threads' } },
    { platform: 'tiktok', modulePath: 'tiktokService', funcName: 'fetchTikTokData', mockResult: { mock: 'tiktok' } },
    { platform: 'tumblr', modulePath: 'tumblrService', funcName: 'fetchTumblrData', mockResult: { mock: 'tumblr' } },
    { platform: 'twitter', modulePath: 'twitterService', funcName: 'twitterDownloader', mockResult: { mock: 'twitter' } },
    { platform: 'youtube', modulePath: 'youtubeService', funcName: 'fetchYouTubeData', mockResult: { mock: 'youtube' } },
  ];

  test.each(platformMockDetails)('correctly routes and executes platform: %s', async ({ platform, modulePath, funcName, mockResult }) => {
    mockDetect.mockReturnValue(platform);

    const fullModulePath = `../../lib/services/${modulePath}`;
    const moduleMock = require(fullModulePath);

    if (funcName) {
      moduleMock[funcName].mockResolvedValue(mockResult);
    } else {
      moduleMock.mockResolvedValue(mockResult);
    }

    const result = await downloadMedia(`https://www.example.com/${platform}`);

    expect(mockDetect).toHaveBeenCalledWith(`https://www.example.com/${platform}`);
    expect(result.success).toBe(true);
    expect(result.platform).toBe(platform);
    expect(result.raw).toEqual(mockResult);

    if (funcName) {
      expect(moduleMock[funcName]).toHaveBeenCalledWith(`https://www.example.com/${platform}`);
    } else {
      expect(moduleMock).toHaveBeenCalledWith(`https://www.example.com/${platform}`);
    }
  });

  it('returns success:false for an unsupported URL', async () => {
    mockDetect.mockReturnValue(null);

    const result = await downloadMedia('https://example.com/video');

    expect(result.success).toBe(false);
    expect(result.platform).toBe('unknown');
    expect(result.error).toMatch(/unsupported/i);
  });

  it('returns success:false when the service throws an error', async () => {
    mockDetect.mockReturnValue('tiktok');
    const mockService = require('../../lib/services/tiktokService').fetchTikTokData;
    mockService.mockRejectedValue(new Error('Network timeout'));

    const result = await downloadMedia('https://www.tiktok.com/@user/video/123');

    expect(result.success).toBe(false);
    expect(result.platform).toBe('tiktok');
    expect(result.error).toBe('Network timeout');
  });

  it('handles non-Error objects thrown by the service', async () => {
    mockDetect.mockReturnValue('tiktok');
    const mockService = require('../../lib/services/tiktokService').fetchTikTokData;
    mockService.mockRejectedValue('String error');

    const result = await downloadMedia('https://www.tiktok.com/@user/video/123');

    expect(result.success).toBe(false);
    expect(result.platform).toBe('tiktok');
    expect(result.error).toBe('String error');
  });
});
