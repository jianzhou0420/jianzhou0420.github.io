import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }, sid); writeFileSync(`/tmp/acrec/${n}.png`, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
// list all buttons in top region (y<110) with title/aria/text/disabled/pos
const topButtons = () => ev(`JSON.stringify([...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().y<110&&b.getBoundingClientRect().width>0).map(b=>{const r=b.getBoundingClientRect();return{t:(b.title||b.getAttribute('aria-label')||b.textContent||'').trim().slice(0,22),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),d:b.disabled||b.getAttribute('aria-disabled')==='true'};}))`);
const status = () => ev(`(()=>{
  const step=(()=>{const e=[...document.querySelectorAll('span,div')].find(x=>/step\\s*\\d+/i.test((x.textContent||'').trim())&&x.getBoundingClientRect().y<90&&x.querySelectorAll('*').length<=1);return e?e.textContent.trim().slice(0,20):'?';})();
  const pano=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));
  const waiting=pano?/waiting/i.test(pano.textContent||''):true;
  const media=pano?[...pano.querySelectorAll('img,canvas')].filter(m=>m.getBoundingClientRect().width>15).length:0;
  const running=[...document.querySelectorAll('*')].some(e=>/canvas running/i.test((e.textContent||''))&&e.querySelectorAll('*').length<=1);
  return JSON.stringify({step,waiting,media,running});
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
  const mg = JSON.parse(await ev(`(()=>{const e=[...document.querySelectorAll('span,div,li,button')].find(x=>/^MapGPT/i.test((x.textContent||'').trim())&&x.querySelectorAll('*').length<=3);const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`));
  await click(mg.x, mg.y, 2); await sleep(1800);
  await clickText('button', `x.textContent.trim()==='Auto Layout'`); await sleep(1400);

  console.log('TOP BUTTONS:', await topButtons());
  console.log('status@load:', await status());

  // A) click top-left toolbar Play (26,66 region)
  const pa = await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y<82`);
  console.log('clicked toolbar Play at', pa);
  for (let k = 0; k < 4; k++) { await sleep(2000); console.log('  +'+((k+1)*2)+'s', await status()); }

  // B) click episode-bar green run button (y 88..108)
  const pb = await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y>=88&&x.getBoundingClientRect().y<=108`);
  console.log('episode-bar Play match:', pb);
  if (pb) for (let k = 0; k < 6; k++) { await sleep(2500); console.log('  ep+'+((k+1)*2.5)+'s', await status()); }
  await shot('diag_after');
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
