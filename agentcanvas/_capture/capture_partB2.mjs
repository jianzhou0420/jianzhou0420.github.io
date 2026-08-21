import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/framesB2';
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
const ctlBtn = (cls) => ev(`(()=>{const b=document.querySelector('${cls}');if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
const emptyPoint = () => ev(`(()=>{const cand=[[300,760],[300,300],[260,800],[200,720],[300,500],[820,820]];const ok=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&!e.closest('.react-flow__node')&&!!e.closest('.react-flow');};for(const [x,y] of cand){if(ok(x,y))return JSON.stringify({x,y});}return null;})()`);
async function panBy(dx, dy) { const ep = await emptyPoint(); if (!ep) { console.log('no empty pt'); return; } const { x: sx, y: sy } = JSON.parse(ep); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', clickCount: 1 }, sid); const N = 20; for (let i = 1; i <= N; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx + dx * i / N, y: sy + dy * i / N, button: 'left' }, sid); await sleep(12); } await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sx + dx, y: sy + dy, button: 'left', clickCount: 1 }, sid); }
// simulated grown bbox of {Thinking Log, Action Log, Panorama Viewer}; pano grows w*6.3,h*9.5 from its top-left
const GW = 6.3, GH = 9.5;
const grownBox = () => ev(`(()=>{
  const get=(re)=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>re.test(n.textContent||''));if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,filled:/panorama/i.test(re.source)?!/waiting/i.test(n.textContent||''):false};};
  const p=get(/panorama viewer/i),t=get(/thinking log/i),a=get(/action log/i);
  if(!p) return null;
  const pw=p.filled?p.w:p.w*${GW}, ph=p.filled?p.h:p.h*${GH};
  const xs=[p.x, t?t.x:p.x, a?a.x:p.x];
  const ys=[p.y, t?t.y:p.y, a?a.y:p.y];
  const left=Math.min(...xs)-14, top=Math.min(...ys)-14;
  const right=Math.max(p.x+pw, t?t.x+t.w:0, a?a.x+a.w:0)+14;
  const bottom=Math.max(p.y+ph, t?t.y+Math.max(t.h,160):0, a?a.y+Math.max(a.h,160):0)+14;
  return JSON.stringify({left:Math.round(left),top:Math.round(top),right:Math.round(right),bottom:Math.round(bottom),cx:Math.round((left+right)/2),cy:Math.round((top+bottom)/2),w:Math.round(right-left),h:Math.round(bottom-top),panoFilled:p.filled});
})()`);
const vstate = () => ev(`(()=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));const media=n?[...n.querySelectorAll('img,canvas')].filter(m=>m.getBoundingClientRect().width>15).length:0;const waiting=n?/waiting/i.test(n.textContent||''):true;const step=(()=>{const e=[...document.querySelectorAll('span,div')].find(x=>/step\\s*\\d+/i.test((x.textContent||'').trim())&&x.getBoundingClientRect().y<90&&x.querySelectorAll('*').length<=1);const m=e&&e.textContent.match(/step\\s*(\\d+)/i);return m?Number(m[1]):0;})();return JSON.stringify({media,waiting,step});})()`);
async function rec(ms, gap = 520) { const end = Date.now() + ms; let last; while (Date.now() < end) { await frame(); await sleep(gap); last = JSON.parse(await vstate()); } return last; }

// target: anchor bbox TOP edge at TOPY (below toolbar), horizontally centre at CX;
// zoom so bbox WIDTH ~ TW, with bottom kept above the State panel (<= BOTLIM)
const CX = 800, TOPY = 184, TW = 1010, BOTLIM = 700;
async function fit() {
  const zin = JSON.parse(await ctlBtn('.react-flow__controls-zoomin'));
  const zout = JSON.parse(await ctlBtn('.react-flow__controls-zoomout'));
  for (let pass = 0; pass < 24; pass++) {
    let b = JSON.parse(await grownBox());
    if (Math.abs(b.cx - CX) > 30 || Math.abs(b.top - TOPY) > 24) { await panBy(CX - b.cx, TOPY - b.top); await sleep(200); b = JSON.parse(await grownBox()); }
    const tooBig = b.w > TW + 60 || b.bottom > BOTLIM;
    const tooSmall = b.w < TW - 60 && b.bottom < BOTLIM - 70;
    if (tooBig) { await click(zout.x, zout.y); await sleep(180); }
    else if (tooSmall) { await click(zin.x, zin.y); await sleep(180); }
    else break;
  }
  return JSON.parse(await grownBox());
}

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
  console.log('pre-fit box:', await grownBox());
  console.log('fitted (idle, sized for grown):', await fit());
  await sleep(500);

  await rec(1600); // idle Waiting, all three framed
  // toolbar Play -> fill, self-heal
  const t0 = Date.now(); let filled = false;
  await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y<82`); console.log('Play');
  while (Date.now() - t0 < 35000) { const s = await rec(1500); console.log('  fill', Math.round((Date.now() - t0) / 1000) + 's', s); if (!s.waiting || s.media > 0) { filled = true; break; } if (Date.now() - t0 > 9000 && Date.now() - t0 < 11000) { await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y<82`); console.log('  re-Play'); } }
  console.log('FILLED', filled, 'box now:', await grownBox());
  // gentle re-fit in case real grown size differs from estimate
  await fit();
  await rec(3000);
  // advance episode 1-2 steps (logs + pano update), keep framed
  await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y>=88&&x.getBoundingClientRect().y<=108`); console.log('episode Play');
  const e0 = Date.now();
  while (Date.now() - e0 < 55000) { const s = await rec(2000); console.log('  ep', Math.round((Date.now() - e0) / 1000) + 's', s); if (s.step >= 2) break; }
  await rec(2500);
  console.log('FRAMES', fi);
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
