export interface DownloadResult {
  success: boolean;
  platform: string;
  data: Record<string, unknown>;  // mirrors upstream { success, data } shape
  error?: string;
}

export type SupportedPlatform =
  | 'bluesky'
  | 'capcut'
  | 'dailymotion'
  | 'douyin'
  | 'facebook'
  | 'instagram'
  | 'kuaishou'
  | 'linkedin'
  | 'pinterest'
  | 'reddit'
  | 'snapchat'
  | 'soundcloud'
  | 'spotify'
  | 'terabox'
  | 'threads'
  | 'tiktok'
  | 'tumblr'
  | 'twitter'
  | 'youtube';
