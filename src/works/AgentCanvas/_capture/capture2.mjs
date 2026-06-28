import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/frames2';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shotFile = async (p) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }, sid); writeFileSync(p, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
const sliderMax = () => ev(`(()=>{const s=document.querySelector('input[type=range]');return s?Number(s.max):-1;})()`);
const setStep = (k) => ev(`(()=>{const s=document.querySelector('input[type=range]');if(!s)return -1;const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(s,String(${k}));s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));return Number(s.max);})()`);

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
  await clickText('button', `x.textContent.trim()==='Replay'`); await sleep(1000);
  await clickText('*', `/20260617_192246/.test(x.textContent||'')&&x.querySelectorAll('*').length<=3`); await sleep(1600);

  // scan first episodes, pick the one with the most steps
  let best = { i: 0, max: 0 };
  for (let i = 0; i < 8; i++) {
    const p = await clickText('*', `/^ep\\s*${i}\\b/i.test((x.textContent||'').trim())&&x.querySelectorAll('*').length<=2`);
    if (!p) break;
    await sleep(1500);
    const mx = await sliderMax();
    console.log('ep', i, 'maxStep', mx);
    if (mx > best.max) best = { i, max: mx };
    if (mx >= 12) break; // good enough
  }
  console.log('CHOSEN ep', best.i, 'steps', best.max);
  await clickText('*', `/^ep\\s*${best.i}\\b/i.test((x.textContent||'').trim())&&x.querySelectorAll('*').length<=2`);
  await sleep(2500);
  const M = Math.max(best.max, 1);

  // timed capture loop ~11fps; advance step on a schedule
  const FPS = 11, perStep = 13, intro = 16, outro = 18;
  const total = intro + (M + 1) * perStep + outro;
  let fi = 0, lastStep = -1;
  await setStep(0);
  for (let f = 0; f < total; f++) {
    let step;
    if (f < intro) step = 0;
    else if (f >= total - outro) step = M;
    else step = Math.min(M, Math.floor((f - intro) / perStep));
    if (step !== lastStep) { await setStep(step); lastStep = step; await sleep(120); }
    await shotFile(`${OUT}/${String(fi++).padStart(5, '0')}.jpg`);
    await sleep(1000 / FPS);
  }
  console.log('PARTB_FRAMES', fi, 'fps', FPS);
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
