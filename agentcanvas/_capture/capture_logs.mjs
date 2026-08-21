import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/framesC';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
let fi = 0;
const frame = async () => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }, sid); writeFileSync(`${OUT}/${String(fi++).padStart(5, '0')}.jpg`, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
// install a global handle to the best scroll container in the main pane
const findScroller = () => ev(`(()=>{
  let best=null,bestD=0;
  for(const e of document.querySelectorAll('div,main,section')){
    const r=e.getBoundingClientRect(); const d=e.scrollHeight-e.clientHeight;
    if(d>200 && r.x>240 && r.width>400 && r.top<220 && r.height>300){ if(d>bestD){bestD=d;best=e;} }
  }
  if(best){ window.__sc=best; return JSON.stringify({mode:'el',cls:(best.className||'').toString().slice(0,50),x:Math.round(best.getBoundingClientRect().x),sh:best.scrollHeight,ch:best.clientHeight}); }
  const de=document.scrollingElement||document.documentElement; window.__sc=de;
  return JSON.stringify({mode:'doc',sh:de.scrollHeight,ch:de.clientHeight});
})()`);
const setScroll = (v) => ev(`(()=>{const e=window.__sc; e.scrollTop=${v}; return e.scrollTop;})()`);
const scInfo = () => ev(`(()=>{const e=window.__sc; return JSON.stringify({top:Math.round(e.scrollTop),sh:e.scrollHeight,ch:e.clientHeight});})()`);

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
  await clickText('button,a,[role=tab]', `/^logs$/i.test(x.textContent.trim())`); await sleep(1600);
  await click(127, 110); await sleep(1800);              // top execution
  await clickText('button,[role=tab]', `/^detail$/i.test((x.textContent||'').trim())`); await sleep(1500);
  const sc = await findScroller(); console.log('scroller:', sc);
  await setScroll(0); await sleep(400);
  const info = JSON.parse(await scInfo());
  const CAP = 20000;                                  // readable slow scroll through the rich first portion
  const maxTop = Math.min(info.sh - info.ch, CAP); console.log('scroll range', maxTop, 'of', info.sh - info.ch);

  // hold a moment at the top
  for (let k = 0; k < 6; k++) { await frame(); await sleep(120); }
  // smooth slow scroll 0 -> maxTop with small even steps
  const N = 200;
  for (let i = 1; i <= N; i++) { await setScroll(Math.round(maxTop * i / N)); await frame(); await sleep(55); }
  // hold at the end
  for (let k = 0; k < 6; k++) { await frame(); await sleep(120); }
  console.log('FRAMES', fi, 'final', await scInfo());
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
