import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const { chrome, send } = launch();
let sid;
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, sid)).result?.result?.value;
const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }, sid); writeFileSync(`/tmp/acrec/${n}.png`, Buffer.from(s.result.data, 'base64')); };
async function click(x, y, c = 1) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c }, sid); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c }, sid); }
async function clickText(sel, pred) { const j = await ev(`(()=>{const b=[...document.querySelectorAll('${sel}')].find(x=>${pred});if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`); if (!j) return null; const p = JSON.parse(j); await click(p.x, p.y); return p; }
// list graph dropdown options
const graphOpts = () => ev(`(()=>{const s=document.querySelector('select');return s?JSON.stringify([...s.options].map(o=>o.textContent.trim().slice(0,30))):'no select';})()`);
// select graph option by regex (React-safe)
const selectGraph = (re) => ev(`(()=>{const s=document.querySelector('select');const o=[...s.options].find(o=>${re}.test(o.textContent));if(!o)return 'notfound';const set=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;set.call(s,o.value);s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));return 'set:'+o.textContent.trim().slice(0,30);})()`);
const setInput = (labelRe, val) => ev(`(()=>{const inp=[...document.querySelectorAll('input')].find(i=>${labelRe}.test(i.previousElementSibling?.textContent||i.parentElement?.textContent||''));if(!inp)return 'noinput';const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(inp,'${val}');inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));return 'set';})()`);
const episodesInfo = () => ev(`(()=>{
  const head=[...document.querySelectorAll('*')].find(e=>/^EPISODES/i.test((e.textContent||'').trim().slice(0,9)));
  // grab any instruction-ish / episode id text in the right panel
  const txt=[...document.querySelectorAll('div,td,span,p')].map(e=>(e.textContent||'').trim()).filter(t=>/walk|lobby|exit|stairs|bedroom|turn/i.test(t)&&t.length>20&&t.length<220);
  const ids=[...document.querySelectorAll('div,td,span')].map(e=>(e.textContent||'').trim()).filter(t=>/\\(\\d+_\\d+\\)|4332|episode/i.test(t)&&t.length<40).slice(0,6);
  const running=/running|in progress/i.test(document.body.textContent||'');
  return JSON.stringify({instr:[...new Set(txt)].slice(0,3),ids:[...new Set(ids)].slice(0,6)});
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
  await clickText('button,a,[role=tab]', `/^evaluate$/i.test(x.textContent.trim())`); await sleep(1500);
  console.log('GRAPH OPTS:', await graphOpts());
  console.log('select MapGPT:', await selectGraph('/MapGPT/i'));
  await sleep(800);
  console.log('set budget:', await setInput('/Step Budget/i', '30'));
  await sleep(400);
  await shot('eval_configured');
  // Start
  const st = await clickText('button', `/^start$/i.test((x.textContent||'').trim())`);
  console.log('Start clicked:', st);
  // poll up to ~180s for episode info
  for (let k = 0; k < 60; k++) {
    await sleep(3000);
    const info = await episodesInfo();
    if (k % 3 === 0 || /lobby|walk/i.test(info)) console.log('t=' + ((k + 1) * 3) + 's', info);
    if (/lobby/i.test(info)) { console.log('*** LOBBY EPISODE PRESENT ***'); await shot('eval_lobby_present'); break; }
  }
  await shot('eval_after');
}
main().catch(e => console.log('ERR', e.message)).finally(() => { chrome.kill('SIGKILL'); process.exit(0); });
