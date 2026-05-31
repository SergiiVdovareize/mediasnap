# mediasnap

`mediasnap` is a high-performance programmatic wrapper package for Node.js servers (e.g. NestJS, Express) around the open-source [universalDownloader](https://github.com/milancodess/universalDownloader) project. It strips away the HTTP/REST routing layer of the original project and exposes pure JavaScript functions for detecting platforms and downloading media from various platforms.

## Supported Platforms
- TikTok
- Instagram
- Facebook
- Twitter (X)
- YouTube
- Reddit
- Pinterest
- Threads
- LinkedIn
- Snapchat
- Soundcloud
- Spotify
- Tumblr
- Douyin
- Kuaishou
- Dailymotion
- Bluesky
- CapCut
- TeraBox

---

## Installation

```bash
npm install mediasnap
```

---

## Usage

### Platform Detection
Detect the downloader platform from a URL:

```typescript
import { detectPlatform } from 'mediasnap';

const platform = detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
console.log(platform); // 'youtube'
```

### Media Downloading
Download media directly using a smart, single entry point `downloadMedia(url)` that automatically matches the appropriate scraper service:

```typescript
import { downloadMedia } from 'mediasnap';

async function run() {
  const result = await downloadMedia('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  
  if (result.success) {
    console.log('Platform:', result.platform);
    console.log('Media data:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}

run();
```

---

## NestJS Integration Example

```typescript
// media.service.ts
import { Injectable } from '@nestjs/common';
import { downloadMedia, DownloadResult } from 'mediasnap';

@Injectable()
export class MediaService {
  async download(url: string): Promise<DownloadResult> {
    return downloadMedia(url);
  }
}
```

---

## Upstream Sync

To sync this wrapper package with upstream changes from `universalDownloader`:

```bash
npm run sync-upstream
```

---

## Author & Credits

- Wrapped and package-maintained by **Antigravity**.
- Original downloader core logic and services created by [milancodess](https://github.com/milancodess) (Milan).

## License

MIT
