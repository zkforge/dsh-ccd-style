#!/usr/bin/env node
/**
 * Local visual harness: renders a DSH web-profile server in headless Chromium
 * at the reference window size and writes screenshots under
 * docs/verification/local/. Development tool only — never packaged.
 *
 * Usage:
 *   node scripts/web-harness.mjs <token-url> <out.png> [--width 1382] [--height 875]
 *                                [--dpr 2] [--wait 2500] [--script "<js>"]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';

const [url, out, ...flags] = process.argv.slice(2);
if (url === undefined || out === undefined) throw new Error('usage: web-harness.mjs <url> <out.png> [flags]');
const flag = (name, fallback) => {
  const index = flags.indexOf(`--${name}`);
  return index === -1 ? fallback : flags[index + 1];
};

const width = Number(flag('width', 1382));
const height = Number(flag('height', 875));
const dpr = Number(flag('dpr', 2));
const waitMs = Number(flag('wait', 2500));
const script = flag('script', undefined);
const pre = flag('pre', undefined);

/** Prefer the cached full Chromium build; fall back to the installed Google Chrome. */
const executablePath = process.env.DSH_HARNESS_CHROMIUM
  ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({
  executablePath,
  args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: dpr,
  colorScheme: 'light',
  locale: 'zh-CN',
});
const page = await context.newPage();
/* The macOS Electron shell marks <html> before React renders; plain web does
   not. Setting it makes the harness render the desktop layout DSH ships. */
if (flags.includes('--desktop')) {
  await context.addInitScript(() => {
    const mark = () => document.documentElement?.setAttribute('data-platform', 'darwin');
    mark();
    document.addEventListener('DOMContentLoaded', mark, { once: true });
    window.addEventListener('load', mark, { once: true });
  });
}
const problems = [];
page.on('console', message => {
  if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`);
});
page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(waitMs);
if (pre !== undefined) {
  await page.evaluate(pre);
  await page.waitForTimeout(700);
}
if (script !== undefined) {
  const result = await page.evaluate(script);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  await page.waitForTimeout(300);
}
mkdirSync(dirname(out), { recursive: true });
await page.screenshot({ path: out });
writeFileSync(`${out}.console.txt`, problems.join('\n'));
process.stdout.write(`${out}\n`);
if (problems.length > 0) process.stdout.write(`console problems: ${problems.length} (see ${out}.console.txt)\n`);
await browser.close();
