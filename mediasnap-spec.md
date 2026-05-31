# Build Spec: `mediasnap` npm Package

## Overview

Create an npm package called **`mediasnap`** that wraps the open-source project
[`milancodess/universalDownloader`](https://github.com/milancodess/universalDownloader)
and exposes a single programmatic entry point suitable for use in **Node.js** servers
(e.g. NestJS), instead of the original Express REST API.

The base repo must be consumed as a **git subtree** so it can be synced
with upstream changes in the future.

---

## Goals

1. Strip Express/HTTP layer — expose pure JavaScript functions, not HTTP endpoints.
2. Single smart `downloadMedia(url)` entry point that auto-detects the platform from the URL.
3. Full TypeScript typings (`.d.ts`) so it integrates cleanly with NestJS.
4. Publishable to npm with a clean `package.json`.
5. Upstream sync strategy documented and scriptable.
6. Test-driven development: unit tests written **before** implementation, integration tests opt-in.

---

## Repository Structure to Create

```
mediasnap/
├── upstream/                  ← git subtree of milancodess/universalDownloader (DO NOT EDIT)
│   ├── services/              ← original service files (one per platform)
│   ├── controllers/
│   ├── routes/
│   ├── index.js
│   └── package.json
│
├── src/
│   ├── index.ts               ← main package entry point
│   ├── detector.ts            ← URL → platform detection logic
│   ├── downloader.ts          ← calls the right upstream service
│   └── types.ts               ← shared TypeScript types
│
├── dist/                      ← compiled output (gitignored, published to npm)
├── scripts/
│   └── sync-upstream.sh       ← helper script to pull latest upstream changes
│
├── tests/
│   ├── unit/
│   │   ├── detector.test.ts   ← URL → platform mapping (no network)
│   │   └── downloader.test.ts ← routing + error handling (mocked services)
│   └── integration/
│       └── live.test.ts       ← real network calls (opt-in, skipped in CI by default)
│
├── jest.config.ts
├── package.json
├── tsconfig.json
├── .npmignore
├── .gitignore
└── README.md
```

---

## Step-by-Step Build Instructions

### Step 1 — Initialize the repo

```bash
mkdir mediasnap && cd mediasnap
git init
npm init -y
```

### Step 2 — Add upstream as a git subtree

```bash
git remote add upstream https://github.com/milancodess/universalDownloader.git
git fetch upstream
git subtree add --prefix=upstream upstream/main --squash
```

> This places the entire upstream project under `upstream/` as a read-only copy
> that can be synced later with `scripts/sync-upstream.sh`.

### Step 3 — Install dependencies

```bash
# Dev/build deps
npm install -D typescript @types/node rimraf
npm install -D jest ts-jest @types/jest

# Runtime deps — copy all entries from upstream/package.json → dependencies
# into this package.json, then run npm install
```

> **Important:** open `upstream/package.json`, read every entry under `dependencies`,
> and declare them identically in the wrapper `package.json`. Do not skip any.

### Step 4 — Write `jest.config.ts`

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testPathPattern: 'tests/unit',          // only unit tests by default
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { lines: 90, functions: 90 }, // enforce coverage
  },
};

export default config;
```

Add these scripts to `package.json`:

```json
"test":            "jest",
"test:unit":       "jest --testPathPattern=tests/unit",
"test:integration":"jest --testPathPattern=tests/integration",
"test:coverage":   "jest --coverage"
```

---

## TDD Order — Write Tests First, Then Implementation

Follow this order strictly:
1. Write the test file
2. Run it — confirm it **fails** (red)
3. Write the implementation
4. Run again — confirm it **passes** (green)
5. Refactor if needed

---

### TDD Step A — Write `tests/unit/detector.test.ts` first

Write this entire test file **before** creating `src/detector.ts`:

```typescript
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
```

Run: `npm run test:unit` → all tests **fail** (detector.ts does not exist yet). ✓

---

### TDD Step B — Implement `src/detector.ts`

Now write `src/detector.ts` (see Step 5 in the original build instructions).

Run: `npm run test:unit` → all detector tests **pass**. ✓

---

### TDD Step C — Write `tests/unit/downloader.test.ts` first

Write this **before** creating `src/downloader.ts`:

```typescript
import { downloadMedia } from '../../src/downloader';

// Mock the entire detector module
jest.mock('../../src/detector', () => ({
  detectPlatform: jest.fn(),
}));

// Mock all upstream services
jest.mock('../../upstream/services/tiktok',      () => jest.fn());
jest.mock('../../upstream/services/meta',        () => jest.fn());
jest.mock('../../upstream/services/twitter',     () => jest.fn());
jest.mock('../../upstream/services/youtube',     () => jest.fn());
jest.mock('../../upstream/services/reddit',      () => jest.fn());
// ... repeat for every service file found in upstream/services/

import { detectPlatform } from '../../src/detector';
const mockDetect = detectPlatform as jest.Mock;

import tiktokService from '../../upstream/services/tiktok';
const mockTiktok = tiktokService as jest.Mock;

describe('downloadMedia()', () => {

  beforeEach(() => jest.clearAllMocks());

  it('routes a TikTok URL to the tiktok service', async () => {
    mockDetect.mockReturnValue('tiktok');
    mockTiktok.mockResolvedValue({ media_url: 'https://cdn.tiktok.com/video.mp4' });

    const result = await downloadMedia('https://www.tiktok.com/@user/video/123');

    expect(mockDetect).toHaveBeenCalledWith('https://www.tiktok.com/@user/video/123');
    expect(mockTiktok).toHaveBeenCalledWith('https://www.tiktok.com/@user/video/123');
    expect(result.success).toBe(true);
    expect(result.platform).toBe('tiktok');
    expect(result.data).toEqual({ media_url: 'https://cdn.tiktok.com/video.mp4' });
  });

  it('returns success:false for an unsupported URL', async () => {
    mockDetect.mockReturnValue(null);

    const result = await downloadMedia('https://example.com/video');

    expect(result.success).toBe(false);
    expect(result.platform).toBe('unknown');
    expect(result.error).toMatch(/unsupported/i);
  });

  it('returns success:false when the service throws', async () => {
    mockDetect.mockReturnValue('tiktok');
    mockTiktok.mockRejectedValue(new Error('Network timeout'));

    const result = await downloadMedia('https://www.tiktok.com/@user/video/123');

    expect(result.success).toBe(false);
    expect(result.platform).toBe('tiktok');
    expect(result.error).toBe('Network timeout');
  });

  it('includes the platform name in every result', async () => {
    mockDetect.mockReturnValue('youtube');

    const youtubeService = require('../../upstream/services/youtube') as jest.Mock;
    youtubeService.mockResolvedValue({ url: 'https://...' });

    const result = await downloadMedia('https://youtu.be/abc');
    expect(result.platform).toBe('youtube');
  });
});
```

Run: `npm run test:unit` → downloader tests **fail** (downloader.ts does not exist yet). ✓

---

### TDD Step D — Implement `src/downloader.ts`

Now write `src/downloader.ts` (see Step 6 in the original build instructions).

Run: `npm run test:unit` → all tests **pass**. ✓
Run: `npm run test:coverage` → confirm ≥ 90% line coverage. ✓

---

### TDD Step E — Write `tests/integration/live.test.ts`

These tests make **real network requests**. They are skipped in normal CI
(`npm test`) and only run explicitly with `npm run test:integration`.

```typescript
/**
 * Integration tests — real network calls.
 * Run with: npm run test:integration
 *
 * These tests may be slow or flaky depending on upstream service availability.
 * Use real public URLs that are unlikely to be deleted.
 */
import { downloadMedia } from '../../src/downloader';

// Increase timeout for real HTTP calls
jest.setTimeout(30_000);

describe('Live integration tests', () => {

  it('downloads a real Reddit post', async () => {
    // Use a stable, publicly accessible Reddit video post
    const url = 'https://www.reddit.com/r/memes/comments/REPLACE_WITH_REAL_ID/';
    const result = await downloadMedia(url);

    expect(result.platform).toBe('reddit');
    // Don't assert exact data shape — just that it returned something
    expect(result.success === true || typeof result.error === 'string').toBe(true);
  });

  it('downloads a real YouTube video info', async () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // stable public video
    const result = await downloadMedia(url);

    expect(result.platform).toBe('youtube');
    expect(result.success === true || typeof result.error === 'string').toBe(true);
  });

  // Add more platforms as you verify they work
});
```

> Integration tests use loose assertions (`success OR error is present`) because
> upstream services may throttle, change APIs, or return different shapes.
> The goal is to confirm the routing and error handling work end-to-end,
> not to validate the upstream service's response format.

### Step 5 — Write `src/types.ts`

```typescript
export interface DownloadResult {
  success: boolean;
  platform: string;
  data: Record<string, unknown>;  // mirrors upstream { success, data } shape
  error?: string;
}

export type SupportedPlatform =
  | 'bluesky' | 'capcut' | 'dailymotion' | 'douyin'
  | 'facebook' | 'instagram' | 'kuaishou' | 'linkedin'
  | 'pinterest' | 'reddit' | 'snapchat' | 'soundcloud'
  | 'spotify' | 'terabox' | 'threads' | 'tiktok'
  | 'tumblr' | 'twitter' | 'youtube';
```

### Step 6 — Write `src/detector.ts`

```typescript
import { SupportedPlatform } from './types';

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: SupportedPlatform }> = [
  { pattern: /tiktok\.com/i,               platform: 'tiktok' },
  { pattern: /instagram\.com/i,            platform: 'instagram' },
  { pattern: /facebook\.com|fb\.watch/i,   platform: 'facebook' },
  { pattern: /twitter\.com|x\.com/i,       platform: 'twitter' },
  { pattern: /youtube\.com|youtu\.be/i,    platform: 'youtube' },
  { pattern: /reddit\.com/i,               platform: 'reddit' },
  { pattern: /pinterest\./i,              platform: 'pinterest' },
  { pattern: /threads\.net/i,              platform: 'threads' },
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
```

### Step 7 — Write `src/downloader.ts`

> **Before writing this file:** open every `.js` file inside `upstream/services/` and
> note the exact export signature of each one (default export vs named export, parameter
> name and type). Adjust the `require()` paths and function calls below to match exactly.

```typescript
import { detectPlatform } from './detector';
import { DownloadResult, SupportedPlatform } from './types';

// Adjust paths after reading upstream/services/*.js
type ServiceFn = (url: string) => Promise<unknown>;

const serviceMap: Record<SupportedPlatform, ServiceFn> = {
  tiktok:      require('../upstream/services/tiktok'),
  instagram:   require('../upstream/services/meta'),   // meta.js handles IG + FB
  facebook:    require('../upstream/services/meta'),
  twitter:     require('../upstream/services/twitter'),
  youtube:     require('../upstream/services/youtube'),
  reddit:      require('../upstream/services/reddit'),
  pinterest:   require('../upstream/services/pinterest'),
  threads:     require('../upstream/services/threads'),
  linkedin:    require('../upstream/services/linkedin'),
  snapchat:    require('../upstream/services/snapchat'),
  soundcloud:  require('../upstream/services/soundcloud'),
  spotify:     require('../upstream/services/spotify'),
  tumblr:      require('../upstream/services/tumblr'),
  douyin:      require('../upstream/services/douyin'),
  kuaishou:    require('../upstream/services/kuaishou'),
  dailymotion: require('../upstream/services/dailymotion'),
  bluesky:     require('../upstream/services/bluesky'),
  capcut:      require('../upstream/services/capcut'),
  terabox:     require('../upstream/services/terabox'),
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
```

### Step 8 — Write `src/index.ts`

```typescript
export { downloadMedia } from './downloader';
export { detectPlatform } from './detector';
export type { DownloadResult, SupportedPlatform } from './types';
```

### Step 9 — Write `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "upstream"]
}
```

### Step 10 — Write `package.json`

```json
{
  "name": "mediasnap",
  "version": "1.0.0",
  "description": "Single entry-point media downloader for TikTok, Instagram, YouTube, Reddit and more. Node.js / NestJS ready.",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "rimraf dist && tsc",
    "prepublishOnly": "npm run build",
    "sync-upstream": "bash scripts/sync-upstream.sh"
  },
  "keywords": ["downloader", "tiktok", "instagram", "youtube", "reddit", "nestjs", "media"],
  "author": "YOUR_NAME",
  "license": "MIT",
  "engines": { "node": ">=18" },
  "dependencies": {
    "<<PASTE ALL DEPS FROM upstream/package.json HERE>>"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "rimraf": "^5.0.0"
  }
}
```

### Step 11 — Write `.npmignore`

```
upstream/
src/
scripts/
*.ts
tsconfig.json
.gitignore
```

### Step 12 — Write `scripts/sync-upstream.sh`

```bash
#!/usr/bin/env bash
# Pulls latest changes from upstream into the upstream/ subtree.
set -e
echo "Syncing upstream milancodess/universalDownloader..."
git fetch upstream
git subtree pull --prefix=upstream upstream/main --squash -m "chore: sync upstream"
echo "Done. Review changes in upstream/services/ and update src/ if APIs changed."
```

```bash
chmod +x scripts/sync-upstream.sh
```

### Step 13 — Verify the build

```bash
npm run build
# dist/ should contain: index.js, index.d.ts, downloader.js, detector.js, types.d.ts
```

Then run a quick smoke test:

```bash
node -e "
const { downloadMedia } = require('./dist');
downloadMedia('https://www.reddit.com/r/memes/comments/EXAMPLE/')
  .then(r => console.log(JSON.stringify(r, null, 2)));
"
```

---

## NestJS Integration (after publishing)

```bash
npm install mediasnap
```

```typescript
// downloader.service.ts
import { Injectable } from '@nestjs/common';
import { downloadMedia, DownloadResult } from 'mediasnap';

@Injectable()
export class DownloaderService {
  async download(url: string): Promise<DownloadResult> {
    return downloadMedia(url);
  }
}
```

```typescript
// downloader.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DownloaderService } from './downloader.service';

@Controller('download')
export class DownloaderController {
  constructor(private readonly service: DownloaderService) {}

  @Get()
  download(@Query('url') url: string) {
    return this.service.download(url);
  }
}
```

---

## Publishing to npm

```bash
# First time
npm login
npm run build
npm publish --access public

# Subsequent releases
npm version patch   # or minor / major
npm publish
```

---

## Upstream Sync Workflow

When `milancodess/universalDownloader` is updated:

```bash
npm run sync-upstream
```

Then review:
1. `upstream/services/` — any new platforms or changed function signatures?
2. `src/detector.ts` — add new platform URL patterns if needed.
3. `src/downloader.ts` — update `serviceMap` if service file names/exports changed.
4. Bump version and republish: `npm version patch && npm publish`

---

## AI Implementation Checklist

- [ ] `git init` and add upstream as git subtree under `upstream/`
- [ ] Read every file in `upstream/services/` — note exact export name and call signature
- [ ] Copy all `dependencies` from `upstream/package.json` into wrapper `package.json`
- [ ] Install Jest + ts-jest dev dependencies
- [ ] Write `tests/unit/detector.test.ts` → run → confirm **red** (all fail)
- [ ] Implement `src/types.ts` and `src/detector.ts` → run → confirm **green**
- [ ] Write `tests/unit/downloader.test.ts` → run → confirm **red** (all fail)
- [ ] Implement `src/downloader.ts` and `src/index.ts` → run → confirm **green**
- [ ] Run `npm run test:coverage` → confirm ≥ 90% line coverage
- [ ] Confirm `npm run build` produces `dist/index.js` and `dist/index.d.ts` with no errors
- [ ] Write `tests/integration/live.test.ts` with real URLs (skipped in default `npm test`)
- [ ] Run `npm run test:integration` manually — confirm at least one platform resolves
- [ ] Verify `.npmignore` excludes `upstream/`, `src/`, `tests/` from the published package
- [ ] Confirm `dist/index.d.ts` exports `downloadMedia`, `detectPlatform`, and all types
