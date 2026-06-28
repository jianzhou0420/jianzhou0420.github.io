// Reusable CDP-over-pipe client for the AgentCanvas editor.
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

export function launch({ url = 'http://localhost:5173', w = 1600, h = 900, prof = '/tmp/chrome-pipe' } = {}) {
  try { rmSync(prof, { recursive: true, force: true }); } catch {}
  const chrome = spawn('google-chrome-stable', [
    '--headless=new', '--remote-debugging-pipe',
    '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
    '--no-first-run', '--mute-audio', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, `--user-data-dir=${prof}`, url
  ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });

  const wr = chrome.stdio[3], rd = chrome.stdio[4];
  let id = 0; const pend = new Map(); let buf = Buffer.alloc(0);
  const listeners = new Map();           // method -> cb
  rd.on('data', c => {
    buf = Buffer.concat([buf, c]); let i;
    while ((i = buf.indexOf(0)) !== -1) {
      const s = buf.slice(0, i).toString(); buf = buf.slice(i + 1);
      let m; try { m = JSON.parse(s); } catch { continue; }
      if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
      else if (m.method && listeners.has(m.method)) listeners.get(m.method)(m.params, m.sessionId);
    }
  });
  const send = (method, params = {}, sessionId) => {
    const i = ++id; const o = { id: i, method, params }; if (sessionId) o.sessionId = sessionId;
    wr.write(JSON.stringify(o) + '\0');
    return new Promise(res => pend.set(i, res));
  };
  const on = (method, cb) => listeners.set(method, cb);
  return { chrome, send, on };
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
