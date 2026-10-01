#!/usr/bin/env node
/**
 * Real-Desktop probe over the running Electron renderer's Chrome DevTools
 * Protocol endpoint. Development/verification tool only: it never ships in the
 * package (`files` excludes scripts/) and it does not modify application files.
 *
 * Usage:
 *   node scripts/desktop-probe.mjs eval "<expression>"
 *   node scripts/desktop-probe.mjs shot <out.png> [--full]
 *   node scripts/desktop-probe.mjs size
 *   node scripts/desktop-probe.mjs console [--wait ms]
 */
import { writeFileSync } from 'node:fs';

const HOST = process.env.DSH_CDP_HOST ?? '127.0.0.1';
const PORT = process.env.DSH_CDP_PORT ?? '9222';

async function pageTarget() {
  const response = await fetch(`http://${HOST}:${PORT}/json/list`);
  const targets = await response.json();
  const page = targets.find(target => target.type === 'page');
  if (page === undefined) throw new Error('no page target on the CDP endpoint');
  return page;
}

class Session {
  #socket;
  #id = 0;
  #pending = new Map();
  #events = [];

  static async open() {
    const target = await pageTarget();
    const session = new Session();
    session.#socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      session.#socket.addEventListener('open', resolve, { once: true });
      session.#socket.addEventListener('error', () => reject(new Error('CDP socket error')), { once: true });
    });
    session.#socket.addEventListener('message', event => {
      const message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
      if (message.id !== undefined) {
        const pending = session.#pending.get(message.id);
        session.#pending.delete(message.id);
        if (pending === undefined) return;
        if (message.error !== undefined) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result);
        return;
      }
      session.#events.push(message);
    });
    return session;
  }

  send(method, params = {}) {
    const id = ++this.#id;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }

  drain() {
    return this.#events.splice(0);
  }

  close() {
    this.#socket.close();
  }
}

async function evaluate(session, expression) {
  const result = await session.send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (result.exceptionDetails !== undefined) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'evaluation failed');
  }
  return result.result.value;
}

const [command, ...rest] = process.argv.slice(2);
const session = await Session.open();
try {
  if (command === 'eval') {
    const value = await evaluate(session, rest.join(' '));
    console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  } else if (command === 'shot') {
    const out = rest.find(argument => !argument.startsWith('--'));
    const full = rest.includes('--full');
    if (out === undefined) throw new Error('shot needs an output path');
    if (full) {
      const metrics = await session.send('Page.getLayoutMetrics');
      const size = metrics.cssContentSize ?? metrics.contentSize;
      await session.send('Emulation.setDeviceMetricsOverride', {
        width: Math.ceil(size.width), height: Math.ceil(size.height),
        deviceScaleFactor: 2, mobile: false,
      });
    }
    const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
    writeFileSync(out, Buffer.from(shot.data, 'base64'));
    if (full) await session.send('Emulation.clearDeviceMetricsOverride');
    console.log(out);
  } else if (command === 'size') {
    const metrics = await session.send('Page.getLayoutMetrics');
    const inner = await evaluate(session, 'return { w: innerWidth, h: innerHeight, dpr: devicePixelRatio }');
    console.log(JSON.stringify({ ...inner, content: metrics.cssContentSize }, null, 2));
  } else if (command === 'cdp') {
    const method = rest[0];
    const params = rest[1] === undefined ? {} : JSON.parse(rest[1]);
    if (method === undefined) throw new Error('cdp needs a protocol method');
    console.log(JSON.stringify(await session.send(method, params)));
  } else if (command === 'capture') {
    const out = rest.find(argument => !argument.startsWith('--'));
    const sizeIndex = rest.indexOf('--size');
    const size = sizeIndex === -1 ? null : rest[sizeIndex + 1];
    if (out === undefined) throw new Error('capture needs an output path');
    if (size !== null) {
      const [width, height] = size.split('x').map(Number);
      await session.send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 2, mobile: false,
      });
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    const shot = await session.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: size !== null,
    });
    if (size !== null) await session.send('Emulation.clearDeviceMetricsOverride');
    writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log(out);
  } else if (command === 'outline') {
    const depth = Number(rest.find(argument => /^\d+$/.test(argument)) ?? 10);
    const outline = await evaluate(session, `
      const lines = [];
      const short = value => String(value).replace(/\\s+/g, ' ').trim().slice(0, 70);
      const walk = (element, level) => {
        if (level > ${depth} || lines.length > 400) return;
        const box = element.getBoundingClientRect();
        const classes = [...element.classList].join('.');
        const attrs = [...element.attributes].filter(a => !['class', 'style'].includes(a.name))
          .map(a => a.name + '="' + short(a.value) + '"').join(' ');
        const own = [...element.childNodes].filter(n => n.nodeType === 3)
          .map(n => short(n.textContent)).join(' ').trim();
        lines.push('  '.repeat(level) + '<' + element.tagName.toLowerCase()
          + (classes ? '.' + classes : '') + (attrs ? ' ' + attrs : '') + '> ['
          + Math.round(box.x) + ',' + Math.round(box.y) + ' ' + Math.round(box.width) + 'x' + Math.round(box.height) + ']'
          + (own ? ' "' + own + '"' : ''));
        for (const child of element.children) walk(child, level + 1);
      };
      walk(document.body, 0);
      return lines.join('\\n');
    `);
    console.log(outline);
  } else if (command === 'console') {
    const waitMs = Number(rest[rest.indexOf('--wait') + 1] ?? 1500);
    await new Promise(resolve => setTimeout(resolve, waitMs));
    for (const event of session.drain()) {
      if (event.method === 'Runtime.consoleAPICalled') {
        const text = (event.params.args ?? []).map(argument => argument.value ?? argument.description ?? '').join(' ');
        console.log(`[${event.params.type}] ${text}`);
      } else if (event.method === 'Runtime.exceptionThrown') {
        console.log(`[exception] ${event.params.exceptionDetails?.exception?.description ?? ''}`);
      }
    }
  } else {
    throw new Error(`unknown command: ${String(command)}`);
  }
} finally {
  session.close();
}
