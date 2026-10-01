#!/usr/bin/env node
/**
 * Structural DOM outline of the running DSH client, for writing version-pinned
 * selectors. Development tool only.
 *
 * Usage: node scripts/dom-outline.mjs <url> [--depth 12] [--max 260] [--wait 3000] [--select <css>]
 */
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';

const [url, ...flags] = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = flags.indexOf(`--${name}`);
  return index === -1 ? fallback : flags[index + 1];
};
const depth = Number(flag('depth', 12));
const max = Number(flag('max', 260));
const waitMs = Number(flag('wait', 3000));

const executablePath = process.env.DSH_HARNESS_CHROMIUM
  ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ executablePath, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1382, height: 875 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(waitMs);
const pre = flag('pre', undefined);
if (pre !== undefined) {
  await page.evaluate(pre);
  await page.waitForTimeout(1200);
}

const outline = await page.evaluate(({ depth, max }) => {
  const lines = [];
  const short = value => String(value).replace(/\s+/g, ' ').trim().slice(0, 60);
  const walk = (element, level) => {
    if (lines.length >= max || level > depth) return;
    const box = element.getBoundingClientRect();
    const classes = [...element.classList].map(name => name.replace(/^_[\dA-Za-z]+_/, '')).join('.');
    const attrs = [...element.attributes]
      .filter(attribute => !['class', 'style'].includes(attribute.name))
      .map(attribute => `${attribute.name}="${short(attribute.value)}"`)
      .join(' ');
    const own = [...element.childNodes]
      .filter(node => node.nodeType === 3)
      .map(node => short(node.textContent))
      .join(' ')
      .trim();
    lines.push(`${'  '.repeat(level)}<${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`
      + `${attrs ? ` ${attrs}` : ''}> [${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}]`
      + `${own ? ` "${own}"` : ''}`);
    for (const child of element.children) walk(child, level + 1);
  };
  walk(document.body, 0);
  return lines.join('\n');
}, { depth, max });

process.stdout.write(`${outline}\n`);
await browser.close();
