'use strict';
const $ = (id) => document.getElementById(id);
const audio = $('birthdayAudio');
const musicBtn = $('musicBtn');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let musicWanted = true;
let toastTimer;
let wishMade = false;
let currentPhoto = 0;
let lastFocused = null;
const photoCaptions = ['把阳光戴在头上','笑起来就很好看','海风会记得这一天','去有海的地方','今天也是可爱本人','吃到好吃的就很快乐','收集一口夏天','永远有出发的勇气','把日子过成彩色'];
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500);
}
function syncMusic() {
  const playing = !audio.paused && !audio.ended;
  musicBtn.classList.toggle('playing', playing);
  musicBtn.setAttribute('aria-pressed', String(playing));
  musicBtn.setAttribute('aria-label', playing ? '暂停生日歌' : '播放生日歌');
  $('musicState').textContent = playing ? '播放中' : '播放';
  $('musicHint').textContent = playing ? '♫ 正在播放：给你的音乐盒生日歌' : '♫ 点一下「开启生日惊喜」，让快乐有声音';
}
async function playMusic() {
  musicWanted = true;
  try { await audio.play(); syncMusic(); return true; }
  catch { syncMusic(); return false; }
}
audio.volume = 0.65;
audio.addEventListener('play', syncMusic);
audio.addEventListener('pause', syncMusic);
audio.addEventListener('error', () => {
  $('musicHint').textContent = '♫ 生日歌加载中，请稍后再点一下';
  musicBtn.setAttribute('aria-pressed','false');
});
musicBtn.addEventListener('click', async () => {
  if (!audio.paused) { musicWanted = false; audio.pause(); }
  else { const ok = await playMusic(); if (!ok) toast('请再点一次，开启生日歌 ♫'); }
});
// Browsers which permit autoplay start immediately. The first real gesture
// supplies user activation on browsers that require it.
document.addEventListener('pointerdown', (event) => {
  if (event.target.closest('#musicBtn')) return;
  if (musicWanted && audio.paused) void playMusic();
}, { passive: true });
document.addEventListener('keydown', (event) => {
  if (['Enter', ' '].includes(event.key) && musicWanted && audio.paused && event.target !== musicBtn) void playMusic();
});
void playMusic();
$('surpriseBtn').addEventListener('click', () => {
  void playMusic();
  burst(180);
  toast('亲爱的猪油渣，21 岁生日快乐！♡');
});
function openDialog(dialog) {
  lastFocused = document.activeElement;
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    lastFocused?.focus({ preventScroll:true });
  });
}
function showPhoto(index) {
  currentPhoto = (index + 9) % 9;
  const path = `assets/photo-${String(currentPhoto + 1).padStart(2, '0')}.jpg`;
  $('lightboxImg').src = path;
  $('lightboxImg').alt = photoCaptions[currentPhoto];
  $('photoCaption').textContent = photoCaptions[currentPhoto];
  $('photoCounter').textContent = `${currentPhoto + 1} / 9`;
}
document.querySelectorAll('[data-photo]').forEach((button) => {
  button.addEventListener('click', () => { showPhoto(Number(button.dataset.photo)); openDialog($('photoDialog')); });
});
$('prevPhoto').addEventListener('click', () => showPhoto(currentPhoto - 1));
$('nextPhoto').addEventListener('click', () => showPhoto(currentPhoto + 1));
$('photoDialog').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { showPhoto(currentPhoto - 1); event.preventDefault(); }
  if (event.key === 'ArrowRight') { showPhoto(currentPhoto + 1); event.preventDefault(); }
});
let touchStartX = 0;
$('lightboxImg').addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive:true });
$('lightboxImg').addEventListener('touchend', event => {
  const delta = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) > 65) showPhoto(currentPhoto + (delta < 0 ? 1 : -1));
}, { passive:true });
$('wishBtn').addEventListener('click', () => {
  if (wishMade) {
    wishMade = false;
    $('cakeScene').classList.remove('extinguished');
    $('wishBtn').innerHTML = '许个愿，吹蜡烛 <span aria-hidden="true">✧</span>';
    $('wishStatus').textContent = '蜡烛又亮起来了，再许一个愿望吧。';
  }
  openDialog($('wishDialog'));
});
$('wishForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (musicWanted) void playMusic();
  wishMade = true;
  $('wishDialog').close();
  $('cakeScene').classList.add('extinguished');
  $('wishBtn').textContent = '再点亮一次蜡烛 ✧';
  const wish = $('wishInput').value.trim();
  $('wishStatus').textContent = wish ? `愿「${wish}」在新的一岁慢慢实现。♡` : '愿望已送达！愿你的 21 岁，所遇皆甜，所想皆如愿。♡';
  // The wish stays in this page only and is never sent to a server.
  $('wishInput').value = '';
  burst(210);
  toast('呼～愿你的每一个愿望，都有回响。✧');
});
$('letterBtn').addEventListener('click', () => openDialog($('letterDialog')));
const canvas = $('confetti');
const ctx = canvas.getContext('2d');
let particles = [];
let frame = 0;
let lastTime = 0;
let viewportW = innerWidth;
let viewportH = innerHeight;
function resizeCanvas() {
  viewportW = innerWidth; viewportH = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = viewportW * dpr;
  canvas.height = viewportH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas, { passive:true });
resizeCanvas();
function burst(count = 130, gentle = false) {
  if (reducedMotion.matches || !ctx) return;
  const colors = ['#ba5776','#e8b3ba','#c7b17a','#a1b496','#f4d997','#d58587'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: gentle ? Math.random()*viewportW : viewportW/2 + (Math.random()-.5)*viewportW*.35,
      y: gentle ? -20 - Math.random()*viewportH*.8 : viewportH*.63,
      vx: gentle ? (Math.random()-.5)*2 : (Math.random()-.5)*14,
      vy: gentle ? 1+Math.random()*2 : -6-Math.random()*11,
      spin: (Math.random()-.5)*.14, angle: Math.random()*Math.PI,
      size: 4+Math.random()*5, life:0, max: gentle ? 300 : 245,
      color:colors[Math.floor(Math.random()*colors.length)], round:Math.random()>.8
    });
  }
  if (!frame) { lastTime = 0; frame = requestAnimationFrame(drawConfetti); }
}
function drawConfetti(time) {
  const dt = Math.min(lastTime ? (time-lastTime)/16.667 : 1, 2.5); lastTime=time;
  ctx.clearRect(0,0,viewportW,viewportH);
  particles = particles.filter(p => p.life < p.max && p.y < viewportH+25);
  particles.forEach(p => {
    p.life += dt; p.vy += .08*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.angle += p.spin*dt;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle); ctx.fillStyle=p.color;
    ctx.globalAlpha = Math.min(1,(p.max-p.life)/45);
    if (p.round) { ctx.beginPath(); ctx.arc(0,0,p.size*.45,0,Math.PI*2); ctx.fill(); }
    else ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.6*Math.cos(p.angle));
    ctx.restore();
  });
  if (particles.length) frame=requestAnimationFrame(drawConfetti);
  else { frame=0; ctx.clearRect(0,0,viewportW,viewportH); }
}
setTimeout(() => burst(45,true), 500);
