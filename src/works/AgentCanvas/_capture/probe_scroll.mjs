import { launch, sleep } from './cdp.mjs';
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const probe = () => ev(`(()=>{
  const out=[];
  for(const e of document.querySelectorAll('*')){
    const d=e.scrollHeight-e.clientHeight; if(d<=120) continue;
    const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
    out.push({tag:e.tagName.toLowerCase(),cls:(e.className||'').toString().slice(0,54),ovy:s.overflowY,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),sh:e.scrollHeight,ch:e.clientHeight});
  }
  return JSON.stringify(out.sort((a,b)=>(b.sh-b.ch)-(a.sh-a.ch)).slice(0,12));
})()`);
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
  await click(127, 110); await sleep(1800);
  await clickText('button,[role=tab]', `/^detail$/i.test((x.textContent||'').trim())`); await sleep(1500);
  console.log('SCROLLABLES:', await probe());
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
