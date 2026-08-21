import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/frames3';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shotFile = async (p) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 }, sid); writeFileSync(p, Buffer.from(s.result.data, 'base64')); };
async function move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); }
async function click(x, y, c = 1) { await move(x, y); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function wheel(x, y, dy) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const panoCenter = () => ev(`(()=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));if(!n)return null;const r=n.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
const stepNum = () => ev(`(()=>{const e=[...document.querySelectorAll('span,div')].find(x=>/step\\s*\\d+/i.test((x.textContent||'').trim())&&x.getBoundingClientRect().y<90&&x.querySelectorAll('*').length<=1);const m=e&&(e.textContent.match(/step\\s*(\\d+)/i));return m?Number(m[1]):0;})()`);

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

  // center + zoom onto the Panorama Viewer node
  let pc = JSON.parse(await panoCenter());
  // drag pane so the node moves toward screen centre
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pc.x, y: pc.y, button: 'left', clickCount: 1 }, sid);
  const tx = 820, ty = 440, steps = 24;
  for (let i = 1; i <= steps; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pc.x + (tx - pc.x) * i / steps, y: pc.y + (ty - pc.y) * i / steps, button: 'left' }, sid); await sleep(16); }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tx, y: ty, button: 'left', clickCount: 1 }, sid);
  for (let i = 0; i < 7; i++) { await wheel(tx, ty, -120); await sleep(60); }
  await sleep(500);
  await shotFile(`${OUT}/_framecheck.jpg`);

  // start the run
  await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y<82`);
  console.log('play clicked; recording...');

  // timed screenshot loop ~1.4fps until step>=5 or ~150s
  const start = Date.now(); let fi = 0; let lastStep = 0;
  while (true) {
    await shotFile(`${OUT}/${String(fi++).padStart(5, '0')}.jpg`);
    await sleep(720);
    if (fi % 5 === 0) {
      const st = await stepNum();
      if (st !== lastStep) { console.log('step', st, 'at', Math.round((Date.now() - start) / 1000) + 's', 'frame', fi); lastStep = st; }
      if (st >= 5 || (Date.now() - start) > 150000) { console.log('stop: step', st); break; }
    }
  }
  console.log('FRAMES3', fi, 'lastStep', lastStep);
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
