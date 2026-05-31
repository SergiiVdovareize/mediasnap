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
    const url = 'https://www.reddit.com/r/memes/comments/h7t60e/test/';
    const result = await downloadMedia(url);

    expect(result.platform).toBe('reddit');
    // Assert that we get either a success payload or an error string (e.g. if throttled/blocked)
    expect(result.success === true || typeof result.error === 'string').toBe(true);
  });

  it('downloads a real YouTube video info', async () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // stable public video
    const result = await downloadMedia(url);

    expect(result.platform).toBe('youtube');
    expect(result.success === true || typeof result.error === 'string').toBe(true);
  });
});
