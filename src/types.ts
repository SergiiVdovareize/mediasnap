export interface AdaptedMediaItem {
  type: 'video' | 'audio' | 'image';
  url: string;
  quality: string | null;
  format: string | null;
  sizeMB?: number | null;
}

export interface DownloadResult {
  success: boolean;
  platform: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  duration: string | number | null;
  media: AdaptedMediaItem[];
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
