import { SupportedPlatform } from './types';

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: SupportedPlatform }> = [
  { pattern: /tiktok\.com/i,               platform: 'tiktok' },
  { pattern: /instagram\.com/i,            platform: 'instagram' },
  { pattern: /facebook\.com|fb\.watch/i,   platform: 'facebook' },
  { pattern: /twitter\.com|\bx\.com/i,       platform: 'twitter' },
  { pattern: /youtube\.com|youtu\.be/i,    platform: 'youtube' },
  { pattern: /reddit\.com/i,               platform: 'reddit' },
  { pattern: /pinterest\./i,              platform: 'pinterest' },
  { pattern: /threads\.(net|com)/i,              platform: 'threads' },
  { pattern: /linkedin\.com/i,             platform: 'linkedin' },
  { pattern: /snapchat\.com/i,             platform: 'snapchat' },
  { pattern: /soundcloud\.com/i,           platform: 'soundcloud' },
  { pattern: /spotify\.com/i,              platform: 'spotify' },
  { pattern: /tumblr\.com/i,               platform: 'tumblr' },
  { pattern: /douyin\.com/i,               platform: 'douyin' },
  { pattern: /kuaishou\.com/i,             platform: 'kuaishou' },
  { pattern: /dailymotion\.com/i,          platform: 'dailymotion' },
  { pattern: /bsky\.app/i,                 platform: 'bluesky' },
  { pattern: /capcut\.com/i,               platform: 'capcut' },
  { pattern: /terabox\.com/i,              platform: 'terabox' },
];

export function detectPlatform(url: string): SupportedPlatform | null {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return null;
}
