import { DownloadResult, AdaptedMediaItem } from './types';

export function adaptResponse(raw: any, platform: string): DownloadResult {
  // 1. If it's a string, it's a direct download URL (like Reddit)
  if (typeof raw === 'string') {
    return {
      success: true,
      platform,
      title: null,
      description: null,
      thumbnail: null,
      duration: null,
      media: [
        {
          type: 'video',
          url: raw,
          quality: 'original',
          format: 'mp4',
        },
      ],
      raw,
    };
  }

  // 2. Unwrap wrapper { success, data } structures if present (like Dailymotion)
  let dataObj = raw;
  if (raw && typeof raw === 'object' && 'success' in raw && 'data' in raw && raw.success === true) {
    dataObj = raw.data;
  }

  // 3. Extract standard fields with fallbacks
  const title = dataObj.title || dataObj.meta?.title || dataObj.video_title || dataObj.caption || dataObj.name || null;
  const description = dataObj.description || dataObj.caption || dataObj.meta?.description || null;
  const thumbnail = dataObj.thumbnail || dataObj.thumb || dataObj.preview || dataObj.image || dataObj.cover || dataObj.meta?.thumbnail || null;
  const duration = dataObj.duration || dataObj.duration_ms || null;

  const media: AdaptedMediaItem[] = [];

  // YouTube / specific streams arrays
  if (Array.isArray(dataObj.videos)) {
    dataObj.videos.forEach((v: any) => {
      if (v && typeof v === 'object' && v.url) {
        media.push({
          type: 'video',
          url: v.url,
          quality: v.quality || null,
          format: (v.format || 'mp4').toLowerCase(),
          sizeMB: v.sizeMB || v.size || null,
        });
      }
    });
  }

  if (Array.isArray(dataObj.audios)) {
    dataObj.audios.forEach((a: any) => {
      if (a && typeof a === 'object' && a.url) {
        media.push({
          type: 'audio',
          url: a.url,
          quality: a.quality || null,
          format: (a.format || 'mp3').toLowerCase(),
          sizeMB: a.sizeMB || a.size || null,
        });
      }
    });
  }

  // Twitter/X / Bluesky / Threads images/photos lists
  if (Array.isArray(dataObj.images)) {
    dataObj.images.forEach((img: any) => {
      const url = typeof img === 'string' ? img : img.url;
      if (url) {
        media.push({
          type: 'image',
          url,
          quality: img.quality || 'original',
          format: img.format || 'jpg',
        });
      }
    });
  }

  if (Array.isArray(dataObj.photos)) {
    dataObj.photos.forEach((p: any) => {
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v: any) => {
          media.push({
            type: 'image',
            url: v.url,
            quality: v.resolution || v.quality || 'original',
            format: v.format || 'jpg',
          });
        });
      } else if (p.url) {
        media.push({
          type: 'image',
          url: p.url,
          quality: p.quality || 'original',
          format: p.format || 'jpg',
        });
      }
    });
  }

  // Generic array formats (downloads, links, results, urls, data arrays)
  const arrayProp =
    dataObj.downloads ||
    dataObj.links ||
    dataObj.results ||
    dataObj.urls ||
    dataObj.medias ||
    (Array.isArray(dataObj.data) ? dataObj.data : null);

  if (Array.isArray(arrayProp)) {
    arrayProp.forEach((item: any) => {
      if (typeof item === 'string') {
        media.push({
          type: 'video',
          url: item,
          quality: 'original',
          format: 'mp4',
        });
      } else if (item && typeof item === 'object') {
        const url = item.url || item.downloadUrl || item.download_url || item.direct_url || item.href;
        if (url) {
          const isAudio =
            item.type === 'audio' ||
            item.format === 'mp3' ||
            (item.text || item.label || '').toLowerCase().includes('audio');
          const isImage =
            item.type === 'image' ||
            item.type === 'photo' ||
            item.format === 'jpg' ||
            item.format === 'png' ||
            item.format === 'jpeg' ||
            item.format === 'image/jpeg';

          const type = isAudio ? 'audio' : isImage ? 'image' : 'video';

          let formatStr = item.format || (type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4');
          formatStr = formatStr.toLowerCase().replace('image/', '').replace('jpeg', 'jpg');

          media.push({
            type,
            url,
            quality: item.quality || item.resolution || item.label || item.text || null,
            format: formatStr,
            sizeMB: item.sizeMB || item.size || null,
          });
        }
      }
    });
  }

  // Single direct URL fallbacks (e.g. Spotify, SoundCloud, CapCut, LinkedIn, snapchat)
  if (media.length === 0) {
    const directUrl =
      dataObj.url ||
      dataObj.downloadUrl ||
      dataObj.download_url ||
      dataObj.direct_url ||
      dataObj.video ||
      dataObj.audio ||
      dataObj.stream;

    if (directUrl && typeof directUrl === 'string') {
      const isAudio = platform === 'spotify' || platform === 'soundcloud' || directUrl.includes('.mp3');
      media.push({
        type: isAudio ? 'audio' : 'video',
        url: directUrl,
        quality: 'original',
        format: isAudio ? 'mp3' : 'mp4',
      });
    }
  }

  return {
    success: true,
    platform,
    title: typeof title === 'string' ? title : null,
    description: typeof description === 'string' ? description : null,
    thumbnail: typeof thumbnail === 'string' ? thumbnail : null,
    duration,
    media,
    raw,
  };
}
