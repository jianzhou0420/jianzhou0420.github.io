import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/framesC2';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
let fi = 0;
const frame = async () => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }, sid); writeFileSync(`${OUT}/${String(fi++).padStart(5, '0')}.jpg`, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const clickExecChild = (i) => ev(`(()=>{const c=document.querySelector('.flex.flex-col.overflow-y-auto');if(!c||!c.children[${i}])return null;const el=c.children[${i}];el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
const bodyHasLobby = () => ev(`/4332_0/.test(document.body.innerText) && /walk to the other end of the lobby/i.test(document.body.innerText)`);
const findScroller = () => ev(`(()=>{let best=null,bestD=0;for(const e of document.querySelectorAll('div,main,section')){const r=e.getBoundingClientRect();const d=e.scrollHeight-e.clientHeight;if(d>200&&r.x>240&&r.width>400&&r.top<220&&r.height>300){if(d>bestD){bestD=d;best=e;}}}if(best){window.__sc=best;return JSON.stringify({sh:best.scrollHeight,ch:best.clientHeight});}window.__sc=document.scrollingElement;return JSON.stringify({sh:0,ch:0});})()`);
const setScroll = (v) => ev(`(()=>{window.__sc.scrollTop=${v};return window.__sc.scrollTop;})()`);
const scInfo = () => ev(`JSON.stringify({sh:window.__sc.scrollHeight,ch:window.__sc.clientHeight})`);

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
  // find the lobby (4332_0) execution by clicking items top-down until body shows it
  let found = false;
  for (let i = 0; i < 12; i++) {
    const c = await clickExecChild(i); if (!c) break; const p = JSON.parse(c);
    await click(p.x, p.y); await sleep(1100);
    await clickText('button,[role=tab]', `/^detail$/i.test((x.textContent||'').trim())`); await sleep(900);
    const ok = await bodyHasLobby();
    console.log('item', i, 'lobby?', ok);
    if (ok) { found = true; break; }
  }
  if (!found) { console.log('LOBBY EXEC NOT FOUND'); return; }
  // ensure Detail tab, scroll capture
  await clickText('button,[role=tab]', `/^detail$/i.test((x.textContent||'').trim())`); await sleep(800);
  const sc = await findScroller(); console.log('scroller', sc);
  // pre-warm: scroll through once so lazy <img>/asset thumbnails fetch + decode
  let info = JSON.parse(await scInfo());
  for (let s = 0; s <= 1.0001; s += 0.06) { await setScroll(Math.round((info.sh - info.ch) * s)); await sleep(220); info = JSON.parse(await scInfo()); }
  await setScroll(0); await sleep(700);
  info = JSON.parse(await scInfo());
  const maxTop = Math.min(info.sh - info.ch, 22000);
  console.log('range', maxTop, 'of', info.sh - info.ch);
  for (let k = 0; k < 6; k++) { await frame(); await sleep(120); }
  const N = 230;
  for (let i = 1; i <= N; i++) { await setScroll(Math.round(maxTop * i / N)); await frame(); await sleep(60); }
  for (let k = 0; k < 6; k++) { await frame(); await sleep(120); }
  console.log('FRAMES', fi, 'final', await scInfo());
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
