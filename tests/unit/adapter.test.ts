import { adaptResponse } from '../../src/adapter';

describe('adaptResponse()', () => {

  it('normalizes string outputs (e.g., Reddit) into a single media item', () => {
    const raw = 'https://rapidsave.com/link.mp4';
    const result = adaptResponse(raw, 'reddit');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('reddit');
    expect(result.title).toBeNull();
    expect(result.media).toEqual([
      {
        type: 'video',
        url: raw,
        quality: 'original',
        format: 'mp4',
      }
    ]);
  });

  it('normalizes TikTok service output', () => {
    const raw = {
      status: true,
      title: 'TikTok Title',
      thumbnail: 'https://thumb.jpg',
      downloads: [
        { text: 'Download Video', url: 'https://tiktok.com/vid.mp4' },
        { text: 'Download Audio', url: 'https://tiktok.com/audio.mp3' }
      ]
    };
    const result = adaptResponse(raw, 'tiktok');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('tiktok');
    expect(result.title).toBe('TikTok Title');
    expect(result.thumbnail).toBe('https://thumb.jpg');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://tiktok.com/vid.mp4', quality: 'Download Video', format: 'mp4', sizeMB: null },
      { type: 'audio', url: 'https://tiktok.com/audio.mp3', quality: 'Download Audio', format: 'mp3', sizeMB: null }
    ]);
  });

  it('normalizes Facebook/Instagram (Snapsave) output', () => {
    const raw = {
      status: true,
      data: [
        { url: 'https://fb.com/hd.mp4', resolution: '720p (HD)' },
        { url: 'https://fb.com/sd.mp4', resolution: '360p (SD)' }
      ]
    };
    const result = adaptResponse(raw, 'facebook');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('facebook');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://fb.com/hd.mp4', quality: '720p (HD)', format: 'mp4', sizeMB: null },
      { type: 'video', url: 'https://fb.com/sd.mp4', quality: '360p (SD)', format: 'mp4', sizeMB: null }
    ]);
  });

  it('normalizes YouTube output', () => {
    const raw = {
      type: 'video',
      url: 'https://youtube.com',
      title: 'YouTube Title',
      thumbnail: 'https://yt.jpg',
      duration: '4:20',
      videos: [
        { url: 'https://yt.com/720.mp4', quality: '720p', format: 'MP4', sizeMB: 12.5 }
      ],
      audios: [
        { url: 'https://yt.com/128.mp3', quality: '128kbps', format: 'MP3', sizeMB: 4.2 }
      ]
    };
    const result = adaptResponse(raw, 'youtube');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('youtube');
    expect(result.title).toBe('YouTube Title');
    expect(result.duration).toBe('4:20');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://yt.com/720.mp4', quality: '720p', format: 'mp4', sizeMB: 12.5 },
      { type: 'audio', url: 'https://yt.com/128.mp3', quality: '128kbps', format: 'mp3', sizeMB: 4.2 }
    ]);
  });

  it('normalizes Twitter/X output', () => {
    const raw = {
      type: 'video',
      title: 'Tweet text',
      thumbnail: 'https://tw.jpg',
      videos: [
        { url: 'https://tw.com/720.mp4', quality: '720p' }
      ],
      images: [
        { url: 'https://tw.com/img.jpg' }
      ]
    };
    const result = adaptResponse(raw, 'twitter');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('twitter');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://tw.com/720.mp4', quality: '720p', format: 'mp4', sizeMB: null },
      { type: 'image', url: 'https://tw.com/img.jpg', quality: 'original', format: 'jpg' }
    ]);
  });

  it('normalizes Threads/Bluesky output containing nested photo variants', () => {
    const raw = {
      platform: 'threads',
      photos: [
        {
          thumbnail: 'https://threads.net/thumb.jpg',
          variants: [
            { url: 'https://threads.net/img_best.jpg', resolution: '1080x1080' }
          ]
        }
      ],
      videos: [
        { url: 'https://threads.net/vid.mp4', format: 'mp4' }
      ]
    };
    const result = adaptResponse(raw, 'threads');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('threads');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://threads.net/vid.mp4', format: 'mp4', quality: null, sizeMB: null },
      { type: 'image', url: 'https://threads.net/img_best.jpg', quality: '1080x1080', format: 'jpg' }
    ]);
  });

  it('normalizes Douyin output', () => {
    const raw = {
      title: 'Douyin Title',
      duration: '0:15',
      links: [
        { label: 'Download Video (watermark)', url: 'https://douyin.com/v1.mp4' },
        { label: 'Download Audio', url: 'https://douyin.com/a1.mp3' }
      ]
    };
    const result = adaptResponse(raw, 'douyin');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('douyin');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://douyin.com/v1.mp4', quality: 'Download Video (watermark)', format: 'mp4', sizeMB: null },
      { type: 'audio', url: 'https://douyin.com/a1.mp3', quality: 'Download Audio', format: 'mp3', sizeMB: null }
    ]);
  });

  it('normalizes Pinterest output', () => {
    const raw = {
      title: 'Pinterest image',
      thumbnail: 'https://pin.jpg',
      downloads: [
        { url: 'https://pin.com/img.jpg', quality: 'original', format: 'image/jpeg' }
      ]
    };
    const result = adaptResponse(raw, 'pinterest');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('pinterest');
    expect(result.media).toEqual([
      { type: 'image', url: 'https://pin.com/img.jpg', quality: 'original', format: 'jpg', sizeMB: null }
    ]);
  });

  it('handles unwrapping of outer { success, data } structures (e.g. Dailymotion)', () => {
    const raw = {
      success: true,
      data: {
        url: 'https://dailymotion.com/vid.mp4',
        title: 'DM Title'
      }
    };
    const result = adaptResponse(raw, 'dailymotion');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('dailymotion');
    expect(result.title).toBe('DM Title');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://dailymotion.com/vid.mp4', quality: 'original', format: 'mp4' }
    ]);
  });

  it('normalizes Spotify/SoundCloud raw responses as audio fallback', () => {
    const raw = {
      url: 'https://musicfab.io/song.mp3',
      title: 'Spotify Track'
    };
    const result = adaptResponse(raw, 'spotify');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('spotify');
    expect(result.title).toBe('Spotify Track');
    expect(result.media).toEqual([
      { type: 'audio', url: 'https://musicfab.io/song.mp3', quality: 'original', format: 'mp3' }
    ]);
  });

  it('normalizes LinkedIn/CapCut raw responses as video fallback', () => {
    const raw = {
      downloadUrl: 'https://linkedin.com/video.mp4',
      title: 'LinkedIn Video'
    };
    const result = adaptResponse(raw, 'linkedin');

    expect(result.success).toBe(true);
    expect(result.platform).toBe('linkedin');
    expect(result.title).toBe('LinkedIn Video');
    expect(result.media).toEqual([
      { type: 'video', url: 'https://linkedin.com/video.mp4', quality: 'original', format: 'mp4' }
    ]);
  });

  it('sorts media items by quality descending and groups them by type (video -> audio -> image)', () => {
    const raw = {
      videos: [
        { url: 'https://yt.com/360.mp4', quality: '360p', format: 'MP4' },
        { url: 'https://yt.com/1080.mp4', quality: '1080p', format: 'MP4' },
        { url: 'https://yt.com/720.mp4', quality: '720p', format: 'MP4' }
      ],
      audios: [
        { url: 'https://yt.com/128.mp3', quality: '128kbps', format: 'MP3' },
        { url: 'https://yt.com/320.mp3', quality: '320kbps', format: 'MP3' }
      ],
      images: [
        { url: 'https://yt.com/thumb_low.jpg', quality: 'low', format: 'jpg' },
        { url: 'https://yt.com/thumb_high.jpg', quality: 'high', format: 'jpg' }
      ]
    };
    const result = adaptResponse(raw, 'youtube');

    expect(result.success).toBe(true);
    expect(result.media).toEqual([
      // Videos sorted descending: 1080p -> 720p -> 360p
      { type: 'video', url: 'https://yt.com/1080.mp4', quality: '1080p', format: 'mp4', sizeMB: null },
      { type: 'video', url: 'https://yt.com/720.mp4', quality: '720p', format: 'mp4', sizeMB: null },
      { type: 'video', url: 'https://yt.com/360.mp4', quality: '360p', format: 'mp4', sizeMB: null },
      // Audios sorted descending: 320kbps -> 128kbps
      { type: 'audio', url: 'https://yt.com/320.mp3', quality: '320kbps', format: 'mp3', sizeMB: null },
      { type: 'audio', url: 'https://yt.com/128.mp3', quality: '128kbps', format: 'mp3', sizeMB: null },
      // Images sorted descending: high (falls back to 1000 score) -> low (falls back to 100 score)
      { type: 'image', url: 'https://yt.com/thumb_high.jpg', quality: 'high', format: 'jpg' },
      { type: 'image', url: 'https://yt.com/thumb_low.jpg', quality: 'low', format: 'jpg' }
    ]);
  });

});
