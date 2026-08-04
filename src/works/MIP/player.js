const EP = [
 {
  "img": "ep10/obs01.jpg",
  "chip": "L×12",
  "acts": [
   2,
   2,
   2,
   2,
   2,
   2,
   2,
   2,
   2,
   2,
   2,
   2
  ],
  "think": "I'm facing a wall, so I need to turn around first—that's a 180-degree rotation, which takes twelve 15-degree turns.",
  "say": "I'm facing a wall. The instruction says to turn around first.",
  "amber": false
 },
 {
  "img": "ep10/obs02.jpg",
  "chip": "F×5",
  "acts": [
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I'm in a bedroom and can see a bed to my right with its foot end ahead. I need to walk forward toward the foot of the bed, then turn right toward what looks like an archway with doors that might lead to the hallway.I can see the bedroom with a bed to my right and an archway that might lead to a hallway. I'll walk toward the end of the bed.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs03.jpg",
  "chip": "R×3",
  "acts": [
   3,
   3,
   3
  ],
  "think": "I've passed the bed and can see a couch on the left now, with an archway to the right that likely leads to the hallway. I should head toward that archway.",
  "say": "I'm near the end of the bed now. The instruction says to turn right toward the hallway — the archway on the right seems to be the entrance. Let me turn right.",
  "amber": false
 },
 {
  "img": "ep10/obs04.jpg",
  "chip": "F×6",
  "acts": [
   1,
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I can see the archway ahead with a hallway leading to another arched doorway beyond it—possibly a closet or next room. The bed is to my right. I'm moving forward through the archway into the hallway.I see an archway leading to a hallway with another arched door beyond it, so I'll walk through it now.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs05.jpg",
  "chip": "L2 F4",
  "acts": [
   2,
   2,
   1,
   1,
   1,
   1
  ],
  "think": "I barely moved—probably hit the bed corner on my right. Let me angle left and navigate around it toward the archway.",
  "say": "The view barely changed — I may be blocked by the bed corner. Let me steer slightly left to go around it.",
  "amber": true
 },
 {
  "img": "ep10/obs06.jpg",
  "chip": "R2 F4",
  "acts": [
   3,
   3,
   1,
   1,
   1,
   1
  ],
  "think": "I've cleared the bed and spotted the archway leading to the hallway on my right—I'll head that direction now.",
  "say": "Good progress — the archway is now on my right. Let me turn toward it and walk through.",
  "amber": true
 },
 {
  "img": "ep10/obs07.jpg",
  "chip": "L3 F3",
  "acts": [
   2,
   2,
   2,
   1,
   1,
   1
  ],
  "think": "I'm realizing I keep getting blocked by the bed when moving forward, so I need to navigate around it differently. Let me head left past the TV area first, then turn right toward the archway to find a clearer path.",
  "say": "I seem to be caught on the bed corner again. Let me move left more decisively before heading to the arch.",
  "amber": true
 },
 {
  "img": "ep10/obs08.jpg",
  "chip": "F2 R3 F2",
  "acts": [
   1,
   1,
   3,
   3,
   3,
   1,
   1
  ],
  "think": "I'm noticing the view hasn't changed much since step 17—I'm probably stuck against something. The TV has shifted closer to center-right and the archway is at the right edge, so I'll move forward a couple more steps and then turn right toward the archway.",
  "say": "",
  "amber": true
 },
 {
  "img": "ep10/obs09.jpg",
  "chip": "F×6",
  "acts": [
   1,
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I'm moving forward through the centered archway and can see a hallway beyond it with another arched doorway that appears to lead to a closet or adjacent room.I see the archway ahead and I'm walking through it into the hallway.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs10.jpg",
  "chip": "F×6",
  "acts": [
   1,
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I'm moving through the archway and down the hallway toward an arched doorway that opens into what looks like a closet or adjacent room.I'm at the archway entrance and heading through the hallway toward the arched doorway ahead, which appears to be a closet.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs11.jpg",
  "chip": "F×5",
  "acts": [
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I'm moving through the hallway toward the arched doorway to the closet, which is slightly to the right. I need to walk forward about four or five steps to reach it.I'm in the hallway and see an arched doorway leading to a closet ahead. I'll walk through it now.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs12.jpg",
  "chip": "L×4",
  "acts": [
   2,
   2,
   2,
   2
  ],
  "think": "I'm navigating between two closet doorways—one on the left and another partially open on the right. I drifted toward the right one, but now I need to turn back left to head through the opening I was originally aiming for.I drifted a bit, so I'm adjusting my position relative to the open doorway on my left.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs13.jpg",
  "chip": "F×5",
  "acts": [
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I'm looking through an arched doorway into what appears to be a bedroom with a dresser and certificates on the wall. This seems to be the hallway leading to the next room, so I should head through that arch.",
  "say": "This arch leads into another room through the hallway. Let me proceed forward.",
  "amber": false
 },
 {
  "img": "ep10/obs14.jpg",
  "chip": "R×6",
  "acts": [
   3,
   3,
   3,
   3,
   3,
   3
  ],
  "think": "I've reached a small room with a dresser, window, and glass doors leading outside, which appears to be the next room after the hallway I just walked through. I'm checking if this is actually the endpoint by looking around to confirm it's a distinct room rather than just another passage.I've entered a new room and am looking around to get my bearings.",
  "say": "",
  "amber": true
 },
 {
  "img": "ep10/obs15.jpg",
  "chip": "R×6",
  "acts": [
   3,
   3,
   3,
   3,
   3,
   3
  ],
  "think": "",
  "say": "",
  "amber": true
 },
 {
  "img": "ep10/obs16.jpg",
  "chip": "F×6",
  "acts": [
   1,
   1,
   1,
   1,
   1,
   1
  ],
  "think": "I'm mentally mapping out the space—the bedroom connects through an arch to a hallway with a closet, which then branches into two directions: one arch leads to the bathroom with the bathtub, and another arch opens into the room I'm currently in with the dresser and glass doors. I'm trying to figure out where this layout ends or if there are more spaces beyond what I've already seen. I'm trying to work out the spatial layout by retracing my steps. After turning 180° from the dresser room, I can see the hallway ahead with the bathroom arch at the far end and the bedroom visible to the right. The question is whether the \"next room\" refers to where I'm currently standing in the dresser room or the bathroom further down the hallway — VLN paths typically end just inside the destination, so the distance and positioning matter for determining which one is correct.\n\nLooking at the current view, I can see what appears to be a bathtub or pedestal fixture through the arch ahead, which suggests that's the bathroom. The instructions said to walk through the hallway to the next room, and I took a left turn to get to the dresser room, which wasn't part of the original directions. So the intended path was probably straight through the hallway toward the bathroom. I'll walk forward down the hallway and stop near the arch entrance to the bathroom — that position should keep me within the 3-meter success radius while being closer to what the instructions actually described.I can see the hallway extends to another room at the far end, likely a bathroom. I'll continue straight down the hallway to the next room.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs17.jpg",
  "chip": "F4 L F2",
  "acts": [
   1,
   1,
   1,
   1,
   2,
   1,
   1
  ],
  "think": "I'm realizing the hallway layout now—the bathroom is ahead to the left with the tub and vanity, while the bedroom with the bed is to the right. But I'm noticing something about the bed itself: the one I'm seeing now has a white or cream-colored cover with a metal frame, which doesn't quite match the blue-gray patterned bedding I observed earlier, so I'm wondering if these are actually the same bedroom or if I'm looking at different spaces.",
  "say": "The bathroom is ahead through the arch. Let me continue into it — that's the \"next room\" at the end of the hallway.",
  "amber": false
 },
 {
  "img": "ep10/obs18.jpg",
  "chip": "L2 F3",
  "acts": [
   2,
   2,
   1,
   1,
   1
  ],
  "think": "I'm standing at the bathroom entrance with the tub and sink visible to my left, and there's a wall or pillar blocking my path ahead. I'll turn slightly left and move into the bathroom.I'm stepping into the bathroom to look around.",
  "say": "",
  "amber": false
 },
 {
  "img": "ep10/obs19.jpg",
  "chip": "F×3",
  "acts": [
   1,
   1,
   1
  ],
  "think": "I'm stepping into the bathroom now, making sure I'm positioned well within the 3-meter range from the room's center before stopping.",
  "say": "I'm at the entrance of the bathroom — the next room through the hallway. Let me step in a bit more and then stop.",
  "amber": false
 },
 {
  "img": "ep10/obs20.jpg",
  "chip": "STOP",
  "acts": [
   0
  ],
  "think": "I've reached the bathroom after following the sequence of movements through the hallway, so I should stop here.I've navigated to the bathroom as instructed and am now inside the room, so I'm stopping here.",
  "say": "",
  "amber": false
 }
];

/* Episode-10 replay player. EP holds the verbatim log data:
   frames, step() arguments, and the model's own recorded reasoning. */
(function () {
  const img = document.getElementById('pv-img');
  const obsno = document.getElementById('pv-obsno');
  const tr = document.getElementById('pv-tr');
  const tape = document.getElementById('pv-tape');
  const playBtn = document.getElementById('pv-play');
  if (!img) return;

  EP.forEach((e, i) => {
    const k = document.createElement('button');
    k.className = 'tk' + (e.amber ? ' amber' : '') + (e.chip === 'STOP' ? ' stopk' : '');
    k.textContent = e.chip;
    k.setAttribute('aria-label', 'observation ' + (i + 1) + ', action ' + e.chip);
    k.addEventListener('click', () => { stop(); show(i); });
    tape.appendChild(k);
    const pre = new Image(); pre.src = e.img;   // preload
  });
  const toks = tape.children;

  let cur = 0, timer = null;
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function show(i) {
    cur = i; const e = EP[i];
    img.src = e.img;
    obsno.textContent = 'obs ' + (i + 1) + ' / ' + EP.length;
    let h = '';
    if (e.think) h += '<div class="tr-think">' + esc(e.think) + '</div>';
    if (e.say) h += '<div class="tr-say">' + esc(e.say) + '</div>';
    const stop = e.chip === 'STOP';
    h += '<div class="tr-call' + (stop ? ' stop' : '') + '"><span class="fn">step</span>([' + e.acts.join(', ') + '])'
       + (stop ? '' : ' <span class="tr-chip">// ' + esc(e.chip) + '</span>') + '</div>';
    if (stop) h += '<div class="tr-done" style="display:block">✓ SUCCESS — stopped 2.98 m from the goal · SPL 0.70 · 111 primitives · 332 s</div>';
    tr.innerHTML = h;
    for (let j = 0; j < toks.length; j++) toks[j].classList.toggle('cur', j === i);
    // horizontal-only scroll — scrollIntoView would also scroll the page itself
    const k = toks[i];
    tape.scrollTo({ left: k.offsetLeft - tape.clientWidth / 2 + k.clientWidth / 2, behavior: 'smooth' });
  }
  function tick() {
    if (cur >= EP.length - 1) { stop(); return; }
    show(cur + 1);
  }
  function play() {
    playBtn.textContent = '❚❚ pause'; playBtn.classList.add('playing');
    if (cur >= EP.length - 1) show(0);
    timer = setInterval(tick, 3200);
  }
  function stop() {
    playBtn.textContent = '▶ play'; playBtn.classList.remove('playing');
    if (timer) { clearInterval(timer); timer = null; }
  }
  playBtn.addEventListener('click', () => { timer ? stop() : play(); });
  document.addEventListener('keydown', (ev) => {
    const r = document.getElementById('watch').getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (ev.key === 'ArrowRight' && cur < EP.length - 1) { stop(); show(cur + 1); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft' && cur > 0) { stop(); show(cur - 1); ev.preventDefault(); }
  });
  show(0);
})();
