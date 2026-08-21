import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';

const OUT = '/tmp/acrec/frames';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });

const { chrome, send, on } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
async function move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); }
async function click(x, y, clickCount = 1) {
  await move(x, y); await sleep(50);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount }, sid); await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount }, sid);
}
async function wheel(x, y, dy) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy }, sid); }
async function clickSel(sel, txt) {
  const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${txt});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
  if (!j) return false; const p = JSON.parse(j); await click(p.x, p.y); return true;
}

// frame collection
let fi = 0; let capturing = false;
on('Page.screencastFrame', (p) => {
  send('Page.screencastFrameAck', { sessionId: p.sessionId }, sid);
  if (capturing) writeFileSync(`${OUT}/${String(fi++).padStart(5, '0')}.jpg`, Buffer.from(p.data, 'base64'));
});

async function main() {
  await sleep(1000);
  await send('Target.setDiscoverTargets', { discover: true });
  const page = (await send('Target.getTargets')).result.targetInfos.find(t => t.type === 'page');
  sid = (await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })).result.sessionId;
  await send('Page.enable', {}, sid);
  await send('Runtime.enable', {}, sid);
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
  await send('Page.navigate', { url: 'http://localhost:5173' }, sid);
  for (let i = 0; i < 50; i++) { await sleep(500); if ((await ev(`document.querySelectorAll('button').length`)) > 3) break; }
  await sleep(1500);

  // load MapGPT (double-click) + Auto Layout
  const mg = JSON.parse(await ev(`(()=>{const e=[...document.querySelectorAll('span,div,li,button')].find(x=>/^MapGPT/i.test((x.textContent||'').trim())&&x.querySelectorAll('*').length<=3);const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`));
  await click(mg.x, mg.y, 2); await sleep(1800);
  await clickSel('button', `x.textContent.trim()==='Auto Layout'`); await sleep(1600);
  // fit the whole graph
  await clickSel('.react-flow__controls-button', `x.className.includes('fitview')`); await sleep(900);
  const nodes = await ev(`document.querySelectorAll('.react-flow__node').length`);
  console.log('nodes:', nodes);

  // ---- start recording ----
  await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1 }, sid);
  capturing = true;
  const cx = 850, cy = 430;            // a point over the canvas pane
  const step = () => sleep(33);        // ~30fps pacing

  // Phase 1 — hold on the fitted graph (tiny nudges so frames emit)
  for (let i = 0; i < 24; i++) { await wheel(cx, cy, i % 2 ? 1 : -1); await step(); }
  // Phase 2 — gentle zoom IN toward centre, kept shallow so nodes stay in frame
  for (let i = 0; i < 55; i++) { await wheel(cx, cy, -12); await step(); }
  // Phase 3 — slow pan across the graph
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 }, sid);
  for (let i = 0; i < 90; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx - i * 3, y: cy - Math.round(Math.sin(i / 30) * 12), button: 'left' }, sid); await step(); }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx - 270, y: cy, button: 'left', clickCount: 1 }, sid);
  // Phase 4 — zoom OUT back to the fitted overview
  for (let i = 0; i < 60; i++) { await wheel(cx, cy, 13); await step(); }
  // Phase 5 — re-fit + settle hold
  await clickSel('.react-flow__controls-button', `x.className.includes('fitview')`);
  for (let i = 0; i < 26; i++) { await wheel(cx, cy, i % 2 ? 1 : -1); await step(); }

  capturing = false;
  await send('Page.stopScreencast', {}, sid);
  await sleep(300);
  console.log('FRAMES', fi);
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
