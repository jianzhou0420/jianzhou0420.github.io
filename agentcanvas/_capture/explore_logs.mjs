import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }, sid); writeFileSync(`/tmp/acrec/${n}.png`, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
// dump top-nav + any toggle-ish buttons, and scrollable containers
const dump = () => ev(`(()=>{
  const btns=[...document.querySelectorAll('button,[role=tab],a')].filter(b=>b.getBoundingClientRect().width>0).map(b=>({t:(b.textContent||b.title||'').trim().slice(0,24),x:Math.round(b.getBoundingClientRect().x),y:Math.round(b.getBoundingClientRect().y)})).filter(b=>b.t);
  const scrollers=[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return (s.overflowY==='auto'||s.overflowY==='scroll')&&e.scrollHeight>e.clientHeight+40&&r.width>200&&r.height>120;}).map(e=>{const r=e.getBoundingClientRect();return{cls:(e.className||'').toString().slice(0,40),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),sh:e.scrollHeight,ch:e.clientHeight};}).slice(0,8);
  return JSON.stringify({btns,scrollers});
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
  // go to top-nav Logs
  const lg = await clickText('button,a,[role=tab]', `/^logs$/i.test(x.textContent.trim())`);
  console.log('clicked Logs nav:', lg);
  await sleep(1800);
  await shot('logs_00');
  console.log('DUMP after Logs:', await dump());
  // try to find a 'detail' toggle
  const det = await clickText('button,a,[role=tab],label', `/detail/i.test(x.textContent||'')`);
  console.log('clicked detail:', det);
  await sleep(1500);
  await shot('logs_01_detail');
  console.log('DUMP after detail:', await dump());
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
