// Temporary Phase-0 de-risking endpoint: confirms whether this Vercel deployment's
// outbound IP is blocked by loo-ool.com the same way a cloud-sandbox IP was during
// investigation (HTTP 403, despite robots.txt permitting crawling). Delete this file
// once that question is answered and the real pipeline (api/enoden-schedule.ts) is
// confirmed working end to end.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  const url = `https://loo-ool.com/rail/coo/EN.json?${Date.now()}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://loo-ool.com/rail/EN/',
      },
    });
    const bodySnippet = (await response.text()).slice(0, 300);
    res.status(200).json({ status: response.status, ok: response.ok, bodySnippet });
  } catch (error) {
    res.status(200).json({ status: 0, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
