#!/usr/bin/env node
/**
 * Responsive check for the running DSH desktop renderer: renders the live app
 * at a set of window sizes inside one CDP connection (a device-metrics
 * override is dropped when the client disconnects), measures the columns and
 * the Composer, and writes one screenshot per size.
 *
 * Verification tool only; never packaged.
 *
 * Usage: node scripts/desktop-responsive.mjs <out-dir> [WxH ...]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, ...sizes] = process.argv.slice(2);
if (outDir === undefined) throw new Error('usage: desktop-responsive.mjs <out-dir> [WxH ...]');
const targets = (sizes.length > 0 ? sizes : ['1374x871', '1100x760', '900x700', '760x640']).map(value => {
  const [width, height] = value.split('x').map(Number);
  return { width, height };
});

const port = process.env.DSH_CDP_PORT ?? '9222';
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = list.find(entry => entry.type === 'page');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', () => reject(new Error('CDP socket error')), { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id !== undefined && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
const send = (method, params = {}) => new Promise(resolve => {
  const next = ++id;
  pending.set(next, resolve);
  socket.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`, returnByValue: true, awaitPromise: true,
  });
  if (result.result?.exceptionDetails !== undefined) throw new Error(JSON.stringify(result.result.exceptionDetails));
  return result.result?.result?.value;
};

mkdirSync(outDir, { recursive: true });
const report = [];
for (const { width, height } of targets) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
  await new Promise(resolve => setTimeout(resolve, 900));
  const geometry = await evaluate(`
    const box = selector => {
      const element = document.querySelector(selector);
      if (element === null) return null;
      const rect = element.getBoundingClientRect();
      return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)];
    };
    const frame = document.querySelector('[data-slot="root"] > div');
    const columns = getComputedStyle(frame).gridTemplateColumns.split(' ');
    return {
      viewport: [innerWidth, innerHeight],
      centerTrack: Number.parseFloat(columns[1] ?? '0'),
      rightTrack: Number.parseFloat(columns[2] ?? '0'),
      collapsed: frame.hasAttribute('data-sidebar-collapsed'),
      sidebarTrack: Number.parseFloat(columns[0] ?? '0'),
      divider: box('._6Qf49G_sidebarCol'),
      sidebar: box('[data-slot="sidebar"] > *'),
      leading: box('[data-slot="shell.leading"]'),
      input: box('[data-input-scroll]'),
      toolRow: box('.yhfFVG_row'),
      send: box('.yhfFVG_primary'),
      dock: box('.yhfFVG_dock'),
      header: box('[data-conversation-header-leading]'),
      headerRow: box('.ST7X_W_header'),
      tabs: box('.ST7X_W_tabs'),
      utilities: box('.ST7X_W_headerUtilities'),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      clippedControls: [...document.querySelectorAll('[data-input-scroll], .yhfFVG_row')]
        .map(element => Math.round(element.getBoundingClientRect().right) > innerWidth)
        .filter(Boolean).length,
      /* The View switcher must stay on the header's single row, keep its own
         width, and never run into the utilities at any window width. */
      tabsOnHeaderRow: (() => {
        const header = document.querySelector('.ST7X_W_header');
        const tabs = document.querySelector('.ST7X_W_tabs');
        if (header === null || tabs === null) return null;
        const a = header.getBoundingClientRect();
        const b = tabs.getBoundingClientRect();
        return b.top >= a.top && b.bottom <= a.bottom
          && Math.round(b.width) === 80 && Math.round(b.height) === 22;
      })(),
      tabsClearOfUtilities: (() => {
        const tabs = document.querySelector('.ST7X_W_tabs');
        const utilities = document.querySelector('.ST7X_W_headerUtilities');
        if (tabs === null || utilities === null) return null;
        return Math.round(tabs.getBoundingClientRect().right) <= Math.round(utilities.getBoundingClientRect().left);
      })(),
      /* The thumb is published geometry, so it has to cover the selected button. */
      thumbOnActiveTab: (() => {
        const tabs = document.querySelector('.ST7X_W_tabs');
        const active = document.querySelector('.ST7X_W_tabActive');
        if (tabs === null || active === null) return null;
        const track = tabs.getBoundingClientRect();
        const segment = active.getBoundingClientRect();
        const x = Number.parseFloat(tabs.style.getPropertyValue('--ccd-view-x'));
        const w = Number.parseFloat(tabs.style.getPropertyValue('--ccd-view-w'));
        return Math.abs(x - (segment.left - track.left)) <= 0.5 && Math.abs(w - segment.width) <= 0.5;
      })(),
      /* The send control must stay on the input surface, and the statistics
         cluster must stay inside the tool row, at every width. */
      sendInsideInput: (() => {
        const input = document.querySelector('[data-input-scroll]');
        const send = document.querySelector('.yhfFVG_primary');
        if (input === null || send === null) return null;
        const a = input.getBoundingClientRect();
        const b = send.getBoundingClientRect();
        return b.top >= a.top && b.bottom <= a.bottom && b.right <= a.right;
      })(),
      dockInsideRow: (() => {
        const row = document.querySelector('.yhfFVG_row');
        const dock = document.querySelector('.yhfFVG_dock');
        if (row === null || dock === null || getComputedStyle(dock).display === 'none') return null;
        const a = row.getBoundingClientRect();
        const b = dock.getBoundingClientRect();
        return b.bottom <= a.bottom + 1 && b.right <= a.right && b.left >= a.left;
      })(),
    };`);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const file = join(outDir, `responsive-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  report.push({ size: `${width}x${height}`, file, ...geometry });
}
await send('Emulation.clearDeviceMetricsOverride');
socket.close();
console.log(JSON.stringify(report, null, 2));
