#!/usr/bin/env node
/**
 * Cold-start verification: quit the running DSH desktop application, relaunch
 * it, and check that the installed plugin loads from the profile at boot.
 *
 * Run detached (`nohup node scripts/desktop-coldstart.mjs … &`): quitting the
 * application also ends the agent session that starts this script.
 *
 * Verification tool only; never packaged.
 *
 * Usage: node scripts/desktop-coldstart.mjs <report-dir> [--app "/Applications/DeepSeek Harness.app"]
 *        [--cdp 9222] [--settle ms]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [reportDir, ...flags] = process.argv.slice(2);
if (reportDir === undefined) throw new Error('usage: desktop-coldstart.mjs <report-dir> [--app <path>]');
const flag = (name, fallback) => {
  const index = flags.indexOf(`--${name}`);
  return index === -1 ? fallback : flags[index + 1];
};
const app = flag('app', '/Applications/DeepSeek Harness.app');
const port = flag('cdp', '9222');
const settleMs = Number(flag('settle', 25_000));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const notes = [];
const note = message => {
  notes.push(`${new Date().toISOString()} ${message}`);
  process.stdout.write(`${notes.at(-1)}\n`);
};

async function listenerPid() {
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
    const line = out.split('\n').slice(1).find(row => row.trim() !== '');
    return line === undefined ? null : Number(line.trim().split(/\s+/)[1]);
  } catch {
    return null;
  }
}

/**
 * The application's main process: the topmost ancestor whose command line is
 * the app's own Mach-O binary. The DSH server is the same binary re-executed
 * with `--expose-internals`, so the walk continues past it; `pgrep -f` does not
 * reliably match the Electron main process on macOS.
 * @returns the main process id, or null when the app is not running.
 */
function mainProcessPid() {
  const binary = `${app}/Contents/MacOS/`;
  let pid = process.pid;
  let candidate = null;
  for (let depth = 0; depth < 12; depth += 1) {
    let row;
    try {
      row = execFileSync('ps', ['-o', 'ppid=,command=', '-p', String(pid)], { encoding: 'utf8' }).trim();
    } catch {
      return candidate;
    }
    const match = row.match(/^(\d+)\s+(.*)$/s);
    if (match === null) return candidate;
    const parent = Number(match[1]);
    if (parent <= 1) return candidate;
    let parentCommand;
    try {
      parentCommand = execFileSync('ps', ['-o', 'command=', '-p', String(parent)], { encoding: 'utf8' }).trim();
    } catch {
      return candidate;
    }
    /* Intermediate shells sit between this script and the app; keep walking. */
    if (parentCommand.startsWith(binary)) candidate = parent;
    pid = parent;
  }
  return candidate;
}

async function cdpTargets() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
    return await response.json();
  } catch {
    return null;
  }
}

class Session {
  static async open() {
    const targets = await cdpTargets();
    const page = targets?.find(entry => entry.type === 'page');
    if (page === undefined) throw new Error('no page target');
    const session = new Session();
    session.socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      session.socket.addEventListener('open', resolve, { once: true });
      session.socket.addEventListener('error', () => reject(new Error('CDP socket error')), { once: true });
    });
    session.id = 0;
    session.pending = new Map();
    session.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id !== undefined && session.pending.has(message.id)) {
        session.pending.get(message.id)(message);
        session.pending.delete(message.id);
      }
    });
    return session;
  }

  send(method, params = {}) {
    const next = ++this.id;
    return new Promise(resolve => {
      this.pending.set(next, resolve);
      this.socket.send(JSON.stringify({ id: next, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`, returnByValue: true, awaitPromise: true,
    });
    if (result.result?.exceptionDetails !== undefined) throw new Error(JSON.stringify(result.result.exceptionDetails));
    return result.result?.result?.value;
  }

  close() {
    this.socket.close();
  }
}

mkdirSync(reportDir, { recursive: true });
const report = { app, port, notes, before: null, after: null, error: null };
try {
  const before = await cdpTargets();
  report.before = { reachable: before !== null, targets: before?.length ?? 0 };
  const pid = mainProcessPid() ?? await listenerPid();
  note(`application main pid=${String(pid)}`);
  if (pid === null) throw new Error('the application is not running');

  note('sending SIGTERM to the application');
  process.kill(pid, 'SIGTERM');
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(500);
    if (await listenerPid() === null) break;
  }
  note(`application stopped: ${String(await listenerPid() === null)}`);

  note('relaunching');
  /* Electron only exposes the DevTools endpoint when the flag is present at
     launch, so the relaunch repeats the debugging port the instance used. */
  execFileSync('open', ['-a', app, '--args', `--remote-debugging-port=${port}`], { stdio: 'ignore' });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(1000);
    if (await cdpTargets() !== null) { ready = true; break; }
  }
  note(`debugging endpoint back: ${String(ready)}`);
  if (!ready) throw new Error('the application did not come back');
  await sleep(settleMs);

  const session = await Session.open();
  try {
    report.after = await session.evaluate(`
      const boot = globalThis.__DSH_BOOT__;
      const tags = [...document.querySelectorAll('style[data-plugin="dsh-ccd-style"]')];
      const frame = document.querySelector('[data-slot="root"] > div');
      return {
        bootHasPlugin: boot.entries.some(entry => entry.id === 'dsh-ccd-style'),
        bootTotal: boot.entries.length,
        rev: boot.rev,
        rootAttribute: document.documentElement.getAttribute('data-dsh-ccd-style'),
        styleCount: tags.length,
        columns: getComputedStyle(frame).gridTemplateColumns,
      };`);
    const shot = await session.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(reportDir, 'coldstart-after-boot.png'), Buffer.from(shot.result.data, 'base64'));
  } finally {
    session.close();
  }
  note('verification finished');
} catch (error) {
  report.error = String(error);
  note(`ERROR ${String(error)}`);
} finally {
  writeFileSync(join(reportDir, 'coldstart-report.json'), JSON.stringify(report, null, 2));
  note(`report written to ${join(reportDir, 'coldstart-report.json')}`);
}
