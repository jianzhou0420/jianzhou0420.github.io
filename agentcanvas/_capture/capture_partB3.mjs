import { launch, sleep } from './cdp.mjs';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
const OUT = '/tmp/acrec/framesB3';
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
// simulated grown bbox of {map node, planner LLM, Thinking Log, Action Log, Panorama Viewer}
// — wide enough that the upstream graph + map peek in (reads as "watch it run while it runs"),
//   NOT just the viewer. pano grows w*6.3,h*9.5 from its top-left.
const GW = 6.3, GH = 9.5;
const grownBox = () => ev(`(()=>{
  const get=(re,pano)=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>re.test(n.textContent||''));if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,filled:pano?!/waiting/i.test(n.textContent||''):false};};
  const p=get(/panorama viewer/i,true),t=get(/thinking log/i),a=get(/action log/i),pl=get(/planner llm/i),mp=get(/update map/i);
  if(!p) return null;
  const pw=p.filled?p.w:p.w*${GW}, ph=p.filled?p.h:p.h*${GH};
  const xs=[p.x], tops=[p.y], rights=[p.x+pw], bots=[p.y+ph];
  for(const n of [t,a,pl,mp]){ if(n){ xs.push(n.x); tops.push(n.y); rights.push(n.x+n.w); bots.push(n.y+Math.max(n.h,80)); } }
  const left=Math.min(...xs)-16, top=Math.min(...tops)-16, right=Math.max(...rights)+16, bottom=Math.max(...bots)+16;
  return JSON.stringify({left:Math.round(left),top:Math.round(top),right:Math.round(right),bottom:Math.round(bottom),cx:Math.round((left+right)/2),cy:Math.round((top+bottom)/2),w:Math.round(right-left),h:Math.round(bottom-top),panoFilled:p.filled});
})()`);
const vstate = () => ev(`(()=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/panorama viewer/i.test(n.textContent||''));const media=n?[...n.querySelectorAll('img,canvas')].filter(m=>m.getBoundingClientRect().width>15).length:0;const waiting=n?/waiting/i.test(n.textContent||''):true;const step=(()=>{const e=[...document.querySelectorAll('span,div')].find(x=>/step\\s*\\d+/i.test((x.textContent||'').trim())&&x.getBoundingClientRect().y<90&&x.querySelectorAll('*').length<=1);const m=e&&e.textContent.match(/step\\s*(\\d+)/i);return m?Number(m[1]):0;})();return JSON.stringify({media,waiting,step});})()`);
async function rec(ms, gap = 520) { const end = Date.now() + ms; let last; while (Date.now() < end) { await frame(); await sleep(gap); last = JSON.parse(await vstate()); } return last; }

// target: centre the (grown) bbox at (CX,CY) inside the usable canvas area; zoom so it fits
// within TWMAX × THMAX. The bbox now spans pipeline row → panorama, so this keeps the
// upstream nodes/map/wires visible above the viewer instead of cropping to the viewer alone.
const CX = 840, CY = 432, TWMAX = 1330, THMAX = 538;
async function fit() {
  const zin = JSON.parse(await ctlBtn('.react-flow__controls-zoomin'));
  const zout = JSON.parse(await ctlBtn('.react-flow__controls-zoomout'));
  for (let pass = 0; pass < 26; pass++) {
    let b = JSON.parse(await grownBox());
    if (Math.hypot(b.cx - CX, b.cy - CY) > 34) { await panBy(CX - b.cx, CY - b.cy); await sleep(200); b = JSON.parse(await grownBox()); }
    const tooBig = b.w > TWMAX || b.h > THMAX;
    const tooSmall = b.w < TWMAX - 110 && b.h < THMAX - 70;
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
  // capture instruction + episode id (for the post overlay)
  const meta = await ev(`(()=>{
    const instr=(()=>{const e=[...document.querySelectorAll('span,div,p')].find(x=>/walk|go |turn|exit|stop|wait|reach|enter|head /i.test((x.textContent||''))&&(x.textContent||'').trim().length>20&&(x.textContent||'').trim().length<240&&x.querySelectorAll('*').length<=2&&x.getBoundingClientRect().y<120);return e?e.textContent.trim():'';})();
    const ep=(()=>{const s=[...document.querySelectorAll('select,div,span')].map(x=>(x.value||x.textContent||'').trim()).find(t=>/[A-Za-z0-9]{8,}\\s*\\(\\d/.test(t));return s||'';})();
    return JSON.stringify({instr,ep});
  })()`);
  console.log('META', meta);
  // run the FULL episode: episode-bar Play auto-advances every step; record until the
  // step count plateaus (~32s no change) or metrics fill, capped at ~200s.
  await clickText('button', `x.title==='Play'&&x.getBoundingClientRect().y>=88&&x.getBoundingClientRect().y<=108`); console.log('episode Play');
  const e0 = Date.now(); let lastStep = -1, lastChange = Date.now();
  while (Date.now() - e0 < 200000) {
    const s = await rec(2000);
    if (s.step !== lastStep) { console.log('  ep', Math.round((Date.now() - e0) / 1000) + 's', s); lastStep = s.step; lastChange = Date.now(); }
    const metricsDone = await ev(`(()=>{const n=[...document.querySelectorAll('.react-flow__node')].find(n=>/^metrics/i.test((n.textContent||'').trim()));return n?!/available after/i.test(n.textContent||''):false;})()`);
    if (metricsDone) { console.log('  metrics filled -> episode done at', Math.round((Date.now() - e0) / 1000) + 's, lastStep', lastStep); break; }
    if (Date.now() - lastChange > 32000) { console.log('  step plateau -> stop at', Math.round((Date.now() - e0) / 1000) + 's, lastStep', lastStep); break; }
  }
  await rec(2500);
  console.log('FRAMES', fi, 'TOTAL_STEPS', lastStep);
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
