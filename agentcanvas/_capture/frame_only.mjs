import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }, sid); writeFileSync(`/tmp/acrec/${n}.png`, Buffer.from(s.result.data, 'base64')); };
async function move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); }
async function click(x, y, c = 1) { await move(x, y); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function wheel(x, y, dy) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const panoRect = () => ev(`(()=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));if(!n)return null;const r=n.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)});})()`);
// find an empty point on the canvas pane (no node under it), preferring lower-center
const emptyPoint = () => ev(`(()=>{
  const cand=[[820,760],[600,780],[1000,790],[760,700],[500,720],[1100,720],[820,300]];
  const elOk=(x,y)=>{const e=document.elementFromPoint(x,y);if(!e)return false;return !e.closest('.react-flow__node')&&!!e.closest('.react-flow');};
  for(const [x,y] of cand){if(elOk(x,y))return JSON.stringify({x,y});}
  return null;
})()`);
async function panBy(dx, dy) {
  const ep = await emptyPoint(); if (!ep) { console.log('no empty point!'); return; }
  const { x: sx, y: sy } = JSON.parse(ep);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', clickCount: 1 }, sid);
  const N = 20; for (let i = 1; i <= N; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx + dx * i / N, y: sy + dy * i / N, button: 'left' }, sid); await sleep(12); }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sx + dx, y: sy + dy, button: 'left', clickCount: 1 }, sid);
}

const zoomInBtn = () => ev(`(()=>{const b=document.querySelector('.react-flow__controls-zoomin');if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
const TX = 800, TY = 430, TARGET_W = 200; // idle width target; grows ~3x with data
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

  let r = JSON.parse(await panoRect()); console.log('after layout:', r);
  const zb = JSON.parse(await zoomInBtn()); console.log('zoomIn btn:', zb);
  // pan to centre, then zoom via the + button (zooms about viewport centre), re-centering as it drifts
  for (let pass = 0; pass < 16; pass++) {
    r = JSON.parse(await panoRect());
    const offc = Math.hypot(r.cx - TX, r.cy - TY);
    if (offc > 40) { await panBy(TX - r.cx, TY - r.cy); await sleep(220); r = JSON.parse(await panoRect()); }
    if (r.w >= TARGET_W) break;
    await click(zb.x, zb.y); await sleep(200);
  }
  r = JSON.parse(await panoRect()); console.log('final:', r);
  await shot('frame_now');
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
