import { detectPlatform } from '../../src/detector';

describe('detectPlatform()', () => {

  // --- Happy path: one representative URL per platform ---
  const cases: Array<[string, string]> = [
    ['https://www.tiktok.com/@user/video/123',           'tiktok'],
    ['https://www.instagram.com/p/ABC123/',              'instagram'],
    ['https://www.facebook.com/watch?v=123',             'facebook'],
    ['https://fb.watch/abc123/',                         'facebook'],
    ['https://twitter.com/user/status/123',              'twitter'],
    ['https://x.com/user/status/123',                   'twitter'],
    ['https://www.youtube.com/watch?v=abc',              'youtube'],
    ['https://youtu.be/abc123',                          'youtube'],
    ['https://www.reddit.com/r/memes/comments/abc/',     'reddit'],
    ['https://www.pinterest.com/pin/123/',               'pinterest'],
    ['https://www.threads.net/@user/post/123',           'threads'],
    ['https://www.linkedin.com/posts/user-123',          'linkedin'],
    ['https://www.snapchat.com/spotlight/abc',           'snapchat'],
    ['https://soundcloud.com/artist/track',              'soundcloud'],
    ['https://open.spotify.com/track/abc',               'spotify'],
    ['https://www.tumblr.com/user/123',                  'tumblr'],
    ['https://www.douyin.com/video/123',                 'douyin'],
    ['https://www.kuaishou.com/short-video/abc',         'kuaishou'],
    ['https://www.dailymotion.com/video/abc',            'dailymotion'],
    ['https://bsky.app/profile/user/post/abc',           'bluesky'],
    ['https://www.capcut.com/t/abc/',                    'capcut'],
    ['https://www.terabox.com/sharing/link?surl=abc',    'terabox'],
  ];

  test.each(cases)('detects %s → %s', (url, expected) => {
    expect(detectPlatform(url)).toBe(expected);
  });

  // --- Edge cases ---
  it('returns null for an unknown URL', () => {
    expect(detectPlatform('https://example.com/video/123')).toBeNull();
  });

  it('returns null for a plain string (not a URL)', () => {
    expect(detectPlatform('not a url at all')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(detectPlatform('')).toBeNull();
  });

  it('is case-insensitive (uppercase domain)', () => {
    expect(detectPlatform('https://WWW.TIKTOK.COM/@user/video/123')).toBe('tiktok');
  });

  it('handles URLs with query params and fragments', () => {
    expect(detectPlatform('https://twitter.com/user/status/123?s=20#anchor')).toBe('twitter');
  });
});
