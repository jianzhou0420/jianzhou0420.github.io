import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }, sid); writeFileSync(`/tmp/acrec/${n}.png`, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const allNodes = () => ev(`JSON.stringify([...document.querySelectorAll('.react-flow__node')].map(n=>{const r=n.getBoundingClientRect();return{name:(n.textContent||'').trim().replace(/\\s+/g,' ').slice(0,26),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};}).sort((a,b)=>a.y-b.y||a.x-b.x))`);
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
  await clickText('button', `x.textContent.trim()==='Auto Layout'`); await sleep(1600);
  console.log(await allNodes());
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
