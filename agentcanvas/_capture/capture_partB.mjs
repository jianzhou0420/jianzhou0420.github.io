import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/framesB';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
let fi = 0;
const frame = async () => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }, sid); writeFileSync(`${OUT}/${String(fi++).padStart(5, '0')}.jpg`, Buffer.from(s.result.data, 'base64')); };
async function move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); }
async function click(x, y, c = 1) { await move(x, y); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const panoRect = () => ev(`(()=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));if(!n)return null;const r=n.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)});})()`);
const emptyPoint = () => ev(`(()=>{const cand=[[820,760],[600,780],[1000,790],[760,700],[500,720],[1100,720],[820,300]];const ok=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&!e.closest('.react-flow__node')&&!!e.closest('.react-flow');};for(const [x,y] of cand){if(ok(x,y))return JSON.stringify({x,y});}return null;})()`);
const zoomInBtn = () => ev(`(()=>{const b=document.querySelector('.react-flow__controls-zoomin');if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
async function panBy(dx, dy) { const ep = await emptyPoint(); if (!ep) return; const { x: sx, y: sy } = JSON.parse(ep); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', clickCount: 1 }, sid); const N = 20; for (let i = 1; i <= N; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx + dx * i / N, y: sy + dy * i / N, button: 'left' }, sid); await sleep(12); } await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sx + dx, y: sy + dy, button: 'left', clickCount: 1 }, sid); }
const vstate = () => ev(`(()=>{
  const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));
  const media=n?[...n.querySelectorAll('img,canvas')].filter(m=>m.getBoundingClientRect().width>15).length:0;
  const waiting=n?/waiting/i.test(n.textContent||''):true;
  const step=(()=>{const e=[...document.querySelectorAll('span,div')].find(x=>/step\\s*\\d+/i.test((x.textContent||'').trim())&&x.getBoundingClientRect().y<90&&x.querySelectorAll('*').length<=1);const m=e&&e.textContent.match(/step\\s*(\\d+)/i);return m?Number(m[1]):0;})();
  return JSON.stringify({media,waiting,step});
})()`);
// record N frames over ~ms, return last state
async function rec(ms, gap = 520) { const end = Date.now() + ms; let last; while (Date.now() < end) { await frame(); await sleep(gap); last = JSON.parse(await vstate()); } return last; }

const TX = 800, TY = 410, TARGET_W = 165;
async function main() {
  await sleep(1000);
  await send('Target.setDiscoverTargets', { discover: true });
  const page = (await send('Target.getTargets')).result.targetInfos.find(t => t.type === 'page');
  sid = (await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })).result.sessionId;
  await send('Page.enable', {}, sid); await send('Runtime.enable', {}, sid);
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
  await send('Page.navigate', { url: 'http://localhost:5173' }, sid);
  for (let i = 0; i < 50; i++) { await sleep(500); if ((await ev(`document.querySelectorAll('button').length`)) > 3) break; }
  await sleep(1500);
  const mg = JSON.parse(await ev(`(()=>{const e=[...document.querySelectorAll('span,div,li,button')].find(x=>/^MapGPT/i.test((x.textContent||'').trim())&&x.querySelectorAll('*').length<=3);const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`));
  await click(mg.x, mg.y, 2); await sleep(1800);
  await clickText('button', `x.textContent.trim()==='Auto Layout'`); await sleep(1400);
  // frame Panorama Viewer
  const zb = JSON.parse(await zoomInBtn());
  for (let pass = 0; pass < 16; pass++) { let r = JSON.parse(await panoRect()); if (Math.hypot(r.cx - TX, r.cy - TY) > 40) { await panBy(TX - r.cx, TY - r.cy); await sleep(220); r = JSON.parse(await panoRect()); } if (r.w >= TARGET_W) break; await click(zb.x, zb.y); await sleep(200); }
  await sleep(600); // settle
  console.log('framed:', await panoRect());

  // a few "Waiting…" frames for the before-state
  await rec(1600);

  // === toolbar Play, self-healing until viewer fills ===
  const t0 = Date.now(); let filled = false;
  await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y<82`);
  console.log('toolbar Play clicked');
  while (Date.now() - t0 < 35000) {
    const s = await rec(1500);
    console.log('  play wait', Math.round((Date.now() - t0) / 1000) + 's', s);
    if (!s.waiting || s.media > 0) { filled = true; break; }
    if (Date.now() - t0 > 9000 && Date.now() - t0 < 11000) { await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y<82`); console.log('  re-clicked Play'); }
  }
  console.log('FILLED?', filled, await panoRect());
  // hold on the filled step-0 panorama (the reveal)
  await rec(3500);

  // === advance the episode 1–2 steps via episode-bar Play (641,98) ===
  await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y>=88&&x.getBoundingClientRect().y<=108`);
  console.log('episode Play clicked');
  const e0 = Date.now();
  while (Date.now() - e0 < 60000) {
    const s = await rec(2000);
    console.log('  ep', Math.round((Date.now() - e0) / 1000) + 's', s);
    if (s.step >= 2) break;
  }
  await rec(2500);
  console.log('FRAMES', fi);
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
