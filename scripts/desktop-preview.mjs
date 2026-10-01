#!/usr/bin/env node
/**
 * Live CSS preview against the *running* DSH desktop renderer.
 *
 * Injects the plugin's stylesheets plus the semantic palette overrides over the
 * Chrome DevTools Protocol, so the macOS desktop layout (window chrome, traffic
 * lights, `data-platform=darwin`) can be calibrated before the plugin is
 * installed. Nothing is written to the app: `clear` or a renderer reload
 * removes every injected node.
 *
 * Verification tool only; never packaged.
 *
 * Usage:
 *   node scripts/desktop-preview.mjs apply
 *   node scripts/desktop-preview.mjs clear
 *   node scripts/desktop-preview.mjs shot <out.png> [--size 1374x871]
 * Preview styles remain until `clear` or a renderer reload. This is CSS-only:
 * use the installed plugin to verify menus, statistics, tabs and placeholder adapters.
 */
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const STYLE_FILES = [
  'src/client/theme/tokens.css',
  'src/client/theme/composer.css',
  'src/client/features/shell/shell.css',
  'src/client/features/sidebar/sidebar.css',
  'src/client/features/conversation/conversation.css',
  'src/client/features/new-session/new-session.css',
];
const PALETTE = `
:root {
  --dsw-alias-bg-base: #fcfcfb;
  --dsw-specific-sidebar-fill: #fbfbfa;
  --dsw-alias-border-l3: #e3e3e1;
}`;

async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = targets.find(target => target.type === 'page');
  if (page === undefined) throw new Error('no page target on the CDP endpoint');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
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
  return {
    close: () => socket.close(),
    send,
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', {
        expression: `(async () => { ${expression} })()`, returnByValue: true, awaitPromise: true,
      });
      if (result.result?.exceptionDetails !== undefined) {
        throw new Error(result.result.exceptionDetails.exception?.description ?? 'evaluation failed');
      }
      return result.result?.result?.value;
    },
  };
}

const [command, ...rest] = process.argv.slice(2);
const css = [...STYLE_FILES.map(file => `/* ${file} */\n${readFileSync(join(root, file), 'utf8')}`), PALETTE].join('\n');

const session = await connect();
try {
  if (command === 'clear') {
    await session.evaluate(`
      for (const node of document.querySelectorAll('[data-ccd-preview]')) node.remove();
      document.documentElement.removeAttribute('data-dsh-ccd-style');
      return 'cleared';`);
    console.log('cleared');
  } else {
    const applied = await session.evaluate(`
      for (const node of document.querySelectorAll('[data-ccd-preview]')) node.remove();
      const style = document.createElement('style');
      style.dataset.ccdPreview = 'true';
      style.dataset.plugin = 'dsh-ccd-style';
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);
      document.documentElement.setAttribute('data-dsh-ccd-style', 'true');
      return { styles: document.querySelectorAll('style[data-plugin="dsh-ccd-style"]').length };`);
    console.log(JSON.stringify(applied));
    if (command === 'geom') {
      const sizeIndex = rest.indexOf('--size');
      const size = sizeIndex === -1 ? '1374x871' : rest[sizeIndex + 1];
      const [width, height] = size.split('x').map(Number);
      await session.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
      await new Promise(resolve => setTimeout(resolve, 600));
      const geometry = await session.evaluate(`
        const box = selector => {
          const element = document.querySelector(selector);
          if (element === null) return null;
          const rect = element.getBoundingClientRect();
          return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)];
        };
        return {
          viewport: [innerWidth, innerHeight],
          sidebarTrack: getComputedStyle(document.querySelector('[data-slot="root"] > div')).gridTemplateColumns,
          sidebar: box('[data-slot="sidebar"] > *'),
          center: box('[data-slot="main"]'),
          header: box('header[data-window-drag]'),
          body: box('[data-conversation-content]'),
          input: box('[data-input-scroll]'),
          toolRow: box('.yhfFVG_row'),
          dock: box('.yhfFVG_dock'),
          card: box('[data-composer-card]'),
          seat: box('[data-composer-seat]'),
          bubble: box('.IzP3Va_bubble'),
          column: box('.icaHSq_column'),
          headline: box('.bocITq_root'),
        };`);
      await session.send('Emulation.clearDeviceMetricsOverride');
      console.log(JSON.stringify(geometry, null, 2));
    } else if (command === 'shot') {
      const out = rest[0];
      const sizeIndex = rest.indexOf('--size');
      const size = sizeIndex === -1 ? null : rest[sizeIndex + 1];
      if (size !== null) {
        const [width, height] = size.split('x').map(Number);
        await session.send('Emulation.setDeviceMetricsOverride', {
          width, height, deviceScaleFactor: 2, mobile: false,
        });
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      if (size !== null) await session.send('Emulation.clearDeviceMetricsOverride');
      writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
      console.log(out);
    }
  }
} finally {
  session.close();
}
