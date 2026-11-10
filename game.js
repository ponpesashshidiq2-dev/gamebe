'use strict';

/* ==================== UTIL ==================== */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function rr(c, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* ==================== BANK SOAL AWAL ==================== */
const DEFAULT_QUESTIONS = [
  { q: 'Berapa hasil dari 12 x 8?', opts: ['86', '96', '106', '94'], ans: 1, subj: 'Matematika' },
  { q: 'Bilangan prima berikut adalah...', opts: ['21', '27', '29', '33'], ans: 2, subj: 'Matematika' },
  { q: 'Hasil dari 144 : 12 adalah...', opts: ['10', '11', '12', '14'], ans: 2, subj: 'Matematika' },
  { q: '0,75 jika ditulis dalam bentuk pecahan adalah...', opts: ['3/4', '7/5', '4/3', '75/10'], ans: 0, subj: 'Matematika' },
  { q: 'Akar kuadrat dari 169 adalah...', opts: ['11', '12', '13', '14'], ans: 2, subj: 'Matematika' },
  { q: 'Bagian tumbuhan yang menyerap air dari tanah adalah...', opts: ['Daun', 'Akar', 'Batang', 'Bunga'], ans: 1, subj: 'IPA' },
  { q: 'Proses tumbuhan membuat makanan disebut...', opts: ['Fotosintesis', 'Respirasi', 'Transpirasi', 'Osmosis'], ans: 0, subj: 'IPA' },
  { q: 'Satuan SI untuk mengukur gaya adalah...', opts: ['Joule', 'Watt', 'Newton', 'Pascal'], ans: 2, subj: 'IPA' },
  { q: 'Planet terbesar dalam tata surya adalah...', opts: ['Bumi', 'Saturnus', 'Mars', 'Jupiter'], ans: 3, subj: 'IPA' },
  { q: 'Sinonim dari kata "ramah" adalah...', opts: ['Sombong', 'Sopan', 'Galak', 'Pemalu'], ans: 1, subj: 'B. Indonesia' },
  { q: 'Pembacaan jam 14.30 adalah...', opts: ['Setengah tiga sore', 'Setengah empat sore', 'Tiga lewat sepuluh', 'Setengah tiga pagi'], ans: 0, subj: 'B. Indonesia' },
  { q: '"Dia pergi ke pasar." Kata kerja pada kalimat tersebut adalah...', opts: ['Dia', 'Pergi', 'Ke', 'Pasar'], ans: 1, subj: 'B. Indonesia' },
  { q: 'Huruf vokal dalam bahasa Inggris adalah...', opts: ['a, e, i, o, u', 'b, c, d, f, g', 'y, z, x, w, v', 'h, j, k, l, m'], ans: 0, subj: 'B. Inggris' },
  { q: 'Arti kata "library" adalah...', opts: ['Laboratorium', 'Perpustakaan', 'Perkantoran', 'Toko buku'], ans: 1, subj: 'B. Inggris' },
  { q: 'Bentuk jam 3:15 dalam bahasa Inggris adalah...', opts: ['Quarter past three', 'Quarter to three', 'Half past three', 'Three o\'clock'], ans: 0, subj: 'B. Inggris' },
  { q: 'Ibu kota negara Indonesia adalah...', opts: ['Bandung', 'Surabaya', 'Jakarta', 'Medan'], ans: 2, subj: 'Umum' },
  { q: 'Semboyan negara Indonesia adalah...', opts: ['Bhinneka Tunggal Ika', 'Merdeka atau Mati', 'Juang Bahagia', 'Pancasila Sakti'], ans: 0, subj: 'Umum' },
  { q: 'Rumus luas lingkaran adalah...', opts: ['2 x pi x r', 'pi x r', 'pi x r kuadrat', '4 x pi x r kuadrat'], ans: 2, subj: 'Matematika' }
];

/* ==================== PENYIMPANAN ==================== */
const LS = { best: 'lb_best', bank: 'lb_bank', interval: 'lb_interval', kelas: 'lb_kelas', session: 'lb_session', admin: 'lb_admin', scores: 'lb_scores' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ==================== LOGIN (ADMIN & PEMAIN) ==================== */
const DEFAULT_ADMIN = { user: 'admin', pass: 'admin123' };
const AUTH = { role: 'player', name: '' };
function adminCreds() { return store.get(LS.admin, DEFAULT_ADMIN); }
function isAdmin() { return AUTH.role === 'admin'; }
function setSession(role, name) {
  AUTH.role = role;
  AUTH.name = name;
  store.set(LS.session, { role: role, name: name });
}
function loginPlayer(name) {
  const n = String(name || '').trim().slice(0, 24);
  if (!n) return { ok: false, msg: 'Nama pemain tidak boleh kosong.' };
  setSession('player', n);
  showMenu();
  return { ok: true };
}
function loginAdmin(user, pass) {
  const c = adminCreds();
  if (String(user).trim() !== c.user || String(pass) !== c.pass)
    return { ok: false, msg: 'Nama pengguna atau kata sandi salah.' };
  setSession('admin', c.user);
  showMenu();
  return { ok: true };
}
function logout() {
  store.del(LS.session);
  AUTH.role = 'player'; AUTH.name = '';
  G.mode = 'login';
  $('#menu').classList.add('hidden');
  $('#hud').classList.add('hidden');
  $('#login').classList.remove('hidden');
  $('#loginError').textContent = '';
  $('#loginPass').value = '';
}
function showMenu() {
  G.mode = 'menu';
  $('#login').classList.add('hidden');
  $('#menu').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('#gameOver').classList.add('hidden');
  $('#questionModal').classList.add('hidden');
  $('#pauseModal').classList.add('hidden');
  applyRoleUI();
  refreshMenu();
}
function applyRoleUI() {
  const admin = isAdmin();
  $('#btnImport').classList.toggle('hidden', !admin);
  $('#btnBank').classList.toggle('hidden', !admin);
  $('#bankChip').classList.toggle('hidden', !admin);
  $('#intervalField').classList.toggle('hidden', !admin);
  $('#adminTools').classList.toggle('hidden', !admin);
  $('#passBox').classList.toggle('hidden', !admin);
  $('#importTitle').textContent = admin ? 'Kelola Soal' : 'Bank Soal';
  $('#whoami').innerHTML = (admin ? 'ADMIN: ' : 'PEMAIN: ') + '<b>' + escapeHtml(AUTH.name) + '</b>';
}

/* ==================== STATE ==================== */
const KELAS_LEVEL = {
  1: { speed: 10, max: 16, gap: 20, lives: 5 },
  2: { speed: 11, max: 18, gap: 19, lives: 5 },
  3: { speed: 13, max: 21, gap: 16, lives: 4 },
  4: { speed: 14, max: 23, gap: 15, lives: 4 },
  5: { speed: 15, max: 25, gap: 14, lives: 3 },
  6: { speed: 16, max: 27, gap: 13, lives: 3 }
};
function levelOf(k) { return KELAS_LEVEL[k] || KELAS_LEVEL[1]; }

const G = {
  mode: 'login',
  kelas: clamp(parseInt(store.get(LS.kelas, 1), 10) || 1, 1, 6),
  interval: store.get(LS.interval, 300),
  dist: 0, speed: 13, time: 0,
  score: 0, coins: 0, lives: 3,
  lane: 0, x: 0, y: 0, vy: 0,
  objs: [], parts: [], spawnAt: 0,
  nextQ: 300, qStartInterval: 300,
  bank: [], queue: [], qi: 0,
  asked: 0, firstTry: 0, miss: 0, tries: 0,
  current: null, qOpenAt: 0, answered: false, wrongAt: 0,
  invuln: 0, shake: 0, flash: 0
};

const BANK_BY_KELAS = (typeof BANK_BY_CLASS !== 'undefined') ? BANK_BY_CLASS : null;

function shuffleOptions(o) {
  const perm = shuffle(o.opts.map((_, i) => i));
  return { q: o.q, opts: perm.map(i => o.opts[i]), ans: perm.indexOf(o.ans), subj: o.subj, src: o.src, kelas: o.kelas };
}
function buildBank() {
  const kelas = G.kelas;
  const custom = store.get(LS.bank, []).filter(c => Number(c.kelas || kelas) === kelas);
  const raw = (BANK_BY_KELAS && BANK_BY_KELAS[kelas]) || DEFAULT_QUESTIONS;
  const base = raw.map(normalizeDefault);
  const ok = [];
  custom.forEach(c => { const n = normalizeAny(c); if (n) ok.push(n); });
  G.bank = ok.concat(base).map(shuffleOptions);
  G.queue = shuffle(G.bank.map((_, i) => i));
  G.qi = 0;
}
function normalizeDefault(o) {
  return { q: o.q, opts: o.opts.slice(), ans: o.ans, subj: o.subj || 'Umum', src: 'bawaan' };
}
function nextQuestionIndex() {
  if (!G.bank.length) return -1;
  if (G.qi >= G.queue.length) { G.queue = shuffle(G.bank.map((_, i) => i)); G.qi = 0; }
  return G.queue[G.qi++];
}

/* ==================== CANVAS ==================== */
const canvas = $('#game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const Z_MAX = 58;
const PLAYER_D = 1.1;
function horizonY() { return H * 0.34; }
function kOf(d) { return 1 / (1 + Math.max(0, d) * 0.16); }
function roadHalf(k) { return W * 0.5 * (0.17 + 0.5 * k); }
function project(lx, d) {
  const k = kOf(d);
  const hz = horizonY();
  return { x: W / 2 + lx * roadHalf(k) * 0.62, y: hz + (H - hz) * k, k: k };
}

/* ==================== GAME FLOW ==================== */
function resetGame() {
  const d = levelOf(G.kelas);
  G.dist = 0; G.speed = d.speed; G.time = 0;
  G.score = 0; G.coins = 0; G.lives = d.lives;
  G.lane = 0; G.x = 0; G.y = 0; G.vy = 0;
  G.objs = []; G.parts = []; G.spawnAt = 60;
  G.qStartInterval = G.interval;
  G.nextQ = Math.min(500, G.interval * 0.7);
  G.asked = 0; G.firstTry = 0; G.miss = 0;
  G.invuln = 0; G.shake = 0; G.flash = 0;
  G.queue = shuffle(G.bank.map((_, i) => i)); G.qi = 0;
}
function startGame() {
  if (G.mode === 'login') return;
  resetGame();
  G.mode = 'running';
  $('#menu').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#gameOver').classList.add('hidden');
  $('#pauseModal').classList.add('hidden');
}
function toMenu() {
  showMenu();
}
function saveScore() {
  const arr = store.get(LS.scores, []);
  arr.push({
    name: AUTH.name || 'Tamu',
    role: AUTH.role,
    kelas: G.kelas,
    score: Math.floor(G.score),
    at: Date.now()
  });
  arr.sort((a, b) => b.score - a.score);
  store.set(LS.scores, arr.slice(0, 30));
}
function renderScores() {
  const ul = $('#scoreList');
  if (!ul) return;
  const arr = store.get(LS.scores, []).slice(0, 5);
  ul.innerHTML = arr.length
    ? arr.map((s, i) => `<li><b>#${i + 1}</b> ${escapeHtml(s.name)} <span class="src">Kelas ${s.kelas} · ${s.score} poin</span></li>`).join('')
    : '<li class="src">Belum ada skor. Jadilah yang pertama!</li>';
}
function gameOver() {
  G.mode = 'over';
  const best = Math.max(store.get(LS.best, 0), Math.floor(G.score));
  store.set(LS.best, best);
  saveScore();
  renderScores();
  const acc = G.asked ? Math.round(G.firstTry / G.asked * 100) : 0;
  $('#goStats').innerHTML = [
    ['Jarak', Math.floor(G.dist) + ' m'],
    ['Skor', Math.floor(G.score)],
    ['Koin', G.coins],
    ['Soal dijawab benar', G.firstTry + ' / ' + G.asked],
    ['Akurasi langsung', acc + '%'],
    ['Rekor', best]
  ].map(r => `<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  $('#gameOver').classList.remove('hidden');
}
function pauseGame() {
  if (G.mode !== 'running') return;
  G.mode = 'paused';
  $('#pauseModal').classList.remove('hidden');
}
function resumeGame() {
  if (G.mode !== 'paused') return;
  G.mode = 'running';
  $('#pauseModal').classList.add('hidden');
}

/* ==================== SOAL ==================== */
function openQuestion() {
  const idx = nextQuestionIndex();
  if (idx < 0) { G.nextQ = G.dist + G.interval * 2; return; }
  G.current = G.bank[idx];
  G.mode = 'question';
  G.tries = 0; G.answered = false;
  G.qOpenAt = performance.now();
  G.qStartInterval = G.qStartInterval || G.interval;

  $('#qSubject').textContent = 'Kelas ' + G.kelas + ' · ' + G.current.subj;
  $('#qCounter').textContent = 'Soal ' + (G.asked + 1);
  $('#qText').textContent = G.current.q;
  $('#qFeedback').textContent = '';
  $('#qFeedback').className = 'feedback';
  $('#qBtnContinue').classList.add('hidden');

  const box = $('#qOptions');
  box.innerHTML = '';
  const keys = ['1', '2', '3', '4', '5', '6'];
  G.current.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="key">${keys[i] || (i + 1)}</span><span>${escapeHtml(o)}</span>`;
    b.addEventListener('click', () => answer(i, b));
    box.appendChild(b);
  });
  $('#questionModal').classList.remove('hidden');
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function answer(i, btn) {
  if (G.mode !== 'question' || G.answered) return;
  if (i === G.current.ans) {
    G.answered = true;
    G.asked++;
    const first = G.tries === 0;
    if (first) G.firstTry++;
    const bonus = first ? 50 : 20;
    G.score += bonus;
    btn.classList.add('correct');
    Array.from($('#qOptions').children).forEach(el => { el.disabled = true; });
    const fb = $('#qFeedback');
    fb.className = 'feedback good';
    fb.textContent = first ? `Benar! Jawaban pertama kali. +${bonus} poin` : `Benar! +${bonus} poin`;
    $('#qBtnContinue').classList.remove('hidden');
    $('#qBtnContinue').focus();
    toast('Jawaban benar! Lanjut berlari', 'good');
  } else {
    G.tries++;
    G.miss++;
    btn.classList.add('wrong');
    Array.from($('#qOptions').children).forEach(el => { el.disabled = true; });
    const qcard = $('.qcard');
    qcard.classList.remove('shake');
    void qcard.offsetWidth;
    qcard.classList.add('shake');
    const fb = $('#qFeedback');
    fb.className = 'feedback bad';
    fb.textContent = 'Jawaban salah! Permainan diulangi dari awal...';
    toast('Jawaban salah! Ulangi dari awal', 'bad');
    G.mode = 'wrong';
    G.wrongAt = performance.now();
  }
}
function continueRun() {
  if (G.mode !== 'question' || !G.answered) return;
  $('#questionModal').classList.add('hidden');
  G.mode = 'running';
  G.qStartInterval = G.interval * rand(0.9, 1.15);
  G.nextQ = G.dist + G.qStartInterval;
  G.score += 10;
}

/* ==================== SPAWN ==================== */
function spawnPattern() {
  const z = Z_MAX;
  const r = Math.random();
  const lanes = [-1, 0, 1];
  const free = randi(0, 2);
  const busy = lanes.filter(l => l !== free);

  if (r < 0.30) {
    // deret koin di satu lajur
    const l = lanes[randi(0, 2)];
    for (let i = 0; i < 5; i++) G.objs.push({ type: 'coin', lane: l, d: z + i * 2.2, hit: false });
  } else if (r < 0.55) {
    // 1 penghalang + koin lajur lain
    const l = lanes[randi(0, 2)];
    G.objs.push({ type: 'barrier', lane: l, d: z, hit: false });
    const l2 = lanes.filter(x => x !== l)[randi(0, 1)];
    for (let i = 0; i < 4; i++) G.objs.push({ type: 'coin', lane: l2, d: z + 2 + i * 2.2, hit: false });
  } else if (r < 0.78) {
    // 2 penghalang, satu lajur bebas berisi koin
    busy.forEach(l => G.objs.push({ type: 'barrier', lane: l, d: z + rand(0, 3), hit: false }));
    for (let i = 0; i < 4; i++) G.objs.push({ type: 'coin', lane: free, d: z + 1 + i * 2.2, hit: false });
  } else {
    // kereta panjang di satu lajur
    const l = lanes[randi(0, 2)];
    G.objs.push({ type: 'train', lane: l, d: z, len: 9, hit: false });
    const others = lanes.filter(x => x !== l);
    const cl = others[randi(0, 1)];
    for (let i = 0; i < 4; i++) G.objs.push({ type: 'coin', lane: cl, d: z + i * 2.4, hit: false });
  }
}

/* ==================== UPDATE ==================== */
function update(dt) {
  if (G.mode === 'menu') {
    G.dist += 7 * dt;
    return;
  }
  if (G.mode === 'question') {
    $('#qTimer').textContent = Math.floor((performance.now() - G.qOpenAt) / 1000) + 's';
    return;
  }
  if (G.mode === 'wrong') {
    if (performance.now() - G.wrongAt > 1600) {
      $('#questionModal').classList.add('hidden');
      startGame();
      toast('Jawaban salah! Permainan diulangi dari awal', 'bad');
    }
    return;
  }
  if (G.mode !== 'running') return;

  const d = levelOf(G.kelas);
  G.time += dt;
  G.speed = Math.min(d.max, d.speed + dt * 0.16);
  G.dist += G.speed * dt;
  G.score += G.speed * dt * 1.2;

  // gerak lajur
  const target = G.lane;
  G.x += (target - G.x) * Math.min(1, dt * 12);

  // lompat
  if (G.y > 0 || G.vy > 0) {
    G.vy -= 8.4 * dt;
    G.y += G.vy * dt;
    if (G.y <= 0) { G.y = 0; G.vy = 0; }
  }

  if (G.invuln > 0) G.invuln -= dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);

  // spawn
  if (G.dist >= G.spawnAt) {
    spawnPattern();
    G.spawnAt = G.dist + d.gap * rand(0.85, 1.25);
  }

  // objek bergerak relatif
  for (const o of G.objs) o.d -= G.speed * dt;
  G.objs = G.objs.filter(o => o.d > -14 && !o.gone);

  // tabrakan
  for (const o of G.objs) {
    if (o.hit) continue;
    const sameLane = Math.abs(G.x - o.lane) < 0.55;
    if (!sameLane) continue;
    let near = false;
    if (o.type === 'train') near = o.d < PLAYER_D + 0.5 && o.d + (o.len || 0) > PLAYER_D - 0.5;
    else near = o.d < PLAYER_D + 0.5 && o.d > PLAYER_D - 0.7;
    if (!near) continue;

    if (o.type === 'coin') {
      o.hit = true; o.gone = true;
      G.coins++; G.score += 10;
      pop(o.lane, 'Koin +10', '#ffd93d');
      continue;
    }
    const cleared = o.type === 'barrier' && G.y > 0.45;
    if (cleared) continue;
    if (G.invuln > 0) continue;

    o.hit = true;
    if (o.type === 'train') o.d = -(o.len || 0) - 14;
    else o.gone = true;
    G.lives--;
    G.invuln = 1.4;
    G.shake = 14;
    G.flash = 0.5;
    pop(G.lane, 'Tabrak!', '#ff6b6b');
    toast('Hati-hati! Nyawa berkurang', 'bad');
    if (G.lives <= 0) { gameOver(); return; }
  }

  // pertanyaan
  if (G.dist >= G.nextQ) openQuestion();
  updateHud();
}
function pop(lane, text, color) {
  const p = project(lane, PLAYER_D);
  G.parts.push({ x: p.x, y: p.y - H * 0.16, vy: -60, life: 1, text: text, color: color });
}
function updateParts(dt) {
  for (const p of G.parts) { p.y += p.vy * dt; p.life -= dt; }
  G.parts = G.parts.filter(p => p.life > 0);
}

function updateHud() {
  $('#hudWho').textContent = (isAdmin() ? 'ADMIN ' : 'PEMAIN ') + (AUTH.name || 'Tamu');
  $('#hudKelas').textContent = 'KELAS ' + G.kelas;
  $('#hudScore').textContent = 'SKOR ' + Math.floor(G.score);
  $('#hudCoins').textContent = 'KOIN ' + G.coins;
  $('#hudDist').textContent = Math.floor(G.dist) + ' M';
  $('#hudTime').textContent = 'WAKTU ' + Math.floor(G.time) + 's';
  const livesEl = $('#hudLives');
  livesEl.textContent = 'NYAWA ' + '\u25AE'.repeat(Math.max(0, G.lives));
  livesEl.classList.toggle('alert', G.lives <= 1);

  const remain = G.nextQ - G.dist;
  const pct = clamp(1 - remain / Math.max(1, G.qStartInterval), 0, 1);
  $('#qFill').style.width = (pct * 100).toFixed(1) + '%';
  $('#qLabel').textContent = 'Soal berikutnya dalam ' + Math.max(0, Math.ceil(remain)) + ' m';
}

/* ==================== RENDER ==================== */
const buildings = [];
(function initBuildings() {
  for (let i = 0; i < 26; i++) {
    buildings.push({ off: rand(0, 1), w: rand(0.03, 0.075), h: rand(0.05, 0.2), c: i % 3 });
  }
})();

function render() {
  const hz = horizonY();
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#2a3f8f');
  sky.addColorStop(0.6, '#4f74d6');
  sky.addColorStop(1, '#8fb6f0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, hz + 2);

  // matahari
  ctx.fillStyle = 'rgba(255,236,150,.9)';
  ctx.beginPath(); ctx.arc(W * 0.78, hz * 0.45, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();

  // gedung
  const scroll = (G.dist * 0.0016) % 1;
  const cols = ['#243055', '#1d2747', '#2b3a63'];
  buildings.forEach((b, i) => {
    let x = ((b.off - scroll + 2) % 1) * (W + 120) - 60;
    const bw = b.w * W, bh = b.h * hz * 1.5;
    ctx.fillStyle = cols[b.c];
    ctx.fillRect(x, hz - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,225,140,.5)';
    for (let r = 0; r < 4; r++)
      for (let c2 = 0; c2 < 3; c2++)
        if ((i + r + c2) % 3 === 0)
          ctx.fillRect(x + 6 + c2 * (bw / 3.4), hz - bh + 8 + r * (bh / 5), 4, 6);
  });

  // tanah
  const gr = ctx.createLinearGradient(0, hz, 0, H);
  gr.addColorStop(0, '#3f7d43');
  gr.addColorStop(1, '#2c5c31');
  ctx.fillStyle = gr;
  ctx.fillRect(0, hz, W, H - hz);

  drawRoad();

  // objek: jauh dulu
  const objs = G.objs.slice().sort((a, b) => b.d - a.d);
  for (const o of objs) {
    if (o.d > Z_MAX + 16 || o.d < -6) continue;
    if (o.type === 'coin') drawCoin(o);
    else if (o.type === 'barrier') drawBarrier(o);
    else if (o.type === 'train') drawTrain(o);
  }

  if (G.mode !== 'menu') drawPlayer();

  for (const p of G.parts) {
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.font = '800 16px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }

  if (G.flash > 0) {
    ctx.fillStyle = `rgba(255,60,60,${G.flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
    G.flash = Math.max(0, G.flash - 0.03);
  }
}

function drawRoad() {
  const near = 0, far = Z_MAX;
  const eL0 = project(-1.8, near), eR0 = project(1.8, near);
  const eL1 = project(-1.8, far), eR1 = project(1.8, far);

  ctx.fillStyle = '#39415f';
  ctx.beginPath();
  ctx.moveTo(eL1.x, eL1.y); ctx.lineTo(eR1.x, eR1.y);
  ctx.lineTo(eR0.x, eR0.y); ctx.lineTo(eL0.x, eL0.y);
  ctx.closePath(); ctx.fill();

  // tepi jalan
  ctx.strokeStyle = '#f4f4f5';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(eL1.x, eL1.y); ctx.lineTo(eL0.x, eL0.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(eR1.x, eR1.y); ctx.lineTo(eR0.x, eR0.y); ctx.stroke();

  // garis putus-putus pemisah lajur
  [-0.6, 0.6].forEach(lx => {
    const off = 6 - (G.dist % 6);
    for (let d = off; d < Z_MAX; d += 6) {
      const a = project(lx, d), b = project(lx, d + 3.1);
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = Math.max(1, a.k * 6);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  });

  // strip merah-putih di bahu jalan
  const off2 = 5 - (G.dist % 5);
  for (let d = off2; d < Z_MAX; d += 5) {
    [-1.8, 1.8].forEach(lx => {
      const a = project(lx, d), b = project(lx, d + 2.5);
      const cIdx = Math.floor((d + G.dist) / 5) % 2;
      ctx.strokeStyle = cIdx ? '#ffffff' : '#ef4444';
      ctx.lineWidth = Math.max(2, a.k * 9);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
  }
}

function drawCoin(o) {
  const p = project(o.lane, o.d);
  if (p.k <= 0.02) return;
  const r = Math.max(2, p.k * H * 0.035);
  const cy = p.y - p.k * H * 0.07 - r;
  ctx.save();
  ctx.translate(p.x, cy);
  const sq = Math.abs(Math.sin(performance.now() / 260 + o.d));
  ctx.scale(0.45 + 0.55 * sq, 1);
  ctx.fillStyle = '#ffcf3f';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c99700';
  ctx.lineWidth = Math.max(1, r * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#fff3b8';
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBarrier(o) {
  const p = project(o.lane, o.d);
  if (p.k <= 0.02) return;
  const u = p.k * H;
  const w = u * 0.17, h = u * 0.11;
  const x = p.x - w / 2, y = p.y - h;
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y, w * 0.55, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  rr(ctx, x, y, w, h, u * 0.012);
  ctx.fillStyle = '#ff8a3d'; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, u * 0.022);
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * w * 0.34, y + h);
    ctx.lineTo(x + i * w * 0.34 + w * 0.4, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, u * 0.012); ctx.stroke();
  // kaki
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(x + w * 0.1, y + h, w * 0.1, h * 0.35);
  ctx.fillRect(x + w * 0.8, y + h, w * 0.1, h * 0.35);
}

function drawTrain(o) {
  const pN = project(o.lane, o.d);
  const pF = project(o.lane, o.d + (o.len || 8));
  if (pN.k <= 0.02) return;
  const wN = pN.k * H * 0.19, hN = pN.k * H * 0.34;
  const wF = pF.k * H * 0.19, hF = pF.k * H * 0.34;

  // sisi atas + sisi kiri/kanan (prisma sederhana)
  ctx.fillStyle = '#c92f3f';
  ctx.beginPath();
  ctx.moveTo(pN.x - wN / 2, pN.y - hN);
  ctx.lineTo(pN.x + wN / 2, pN.y - hN);
  ctx.lineTo(pF.x + wF / 2, pF.y - hF);
  ctx.lineTo(pF.x - wF / 2, pF.y - hF);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#8e2230';
  ctx.beginPath();
  ctx.moveTo(pN.x + wN / 2, pN.y - hN);
  ctx.lineTo(pF.x + wF / 2, pF.y - hF);
  ctx.lineTo(pF.x + wF / 2, pF.y);
  ctx.lineTo(pN.x + wN / 2, pN.y);
  ctx.closePath(); ctx.fill();

  // muka depan
  rr(ctx, pN.x - wN / 2, pN.y - hN, wN, hN, wN * 0.12);
  ctx.fillStyle = '#e23b4c'; ctx.fill();
  // jendela depan
  rr(ctx, pN.x - wN * 0.36, pN.y - hN * 0.86, wN * 0.72, hN * 0.34, wN * 0.08);
  ctx.fillStyle = '#9fd8ff'; ctx.fill();
  // lampu
  ctx.fillStyle = '#ffe680';
  ctx.beginPath(); ctx.arc(pN.x - wN * 0.28, pN.y - hN * 0.16, wN * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pN.x + wN * 0.28, pN.y - hN * 0.16, wN * 0.08, 0, Math.PI * 2); ctx.fill();
  // rel
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = Math.max(1, pN.k * 4);
  ctx.beginPath();
  ctx.moveTo(pN.x - wN / 2, pN.y - hN * 0.5);
  ctx.lineTo(pF.x - wF / 2, pF.y - hF * 0.5);
  ctx.stroke();
}

function drawPlayer() {
  const feet = project(0, PLAYER_D).y;
  const p = project(G.x, PLAYER_D);
  const jumpPx = G.y * H * 0.22;
  const U = H * 0.17;
  const x = p.x, y = feet - jumpPx;
  const t = performance.now() / 1000;
  const running = G.mode === 'running';
  const swing = running ? Math.sin(t * 13) : 0;
  const blink = G.invuln > 0 && Math.floor(t * 12) % 2 === 0;

  ctx.save();
  if (blink) ctx.globalAlpha = 0.45;

  // bayangan
  ctx.fillStyle = `rgba(0,0,0,${0.35 - G.y * 0.18})`;
  ctx.beginPath();
  ctx.ellipse(x, feet, U * 0.3 * (1 - G.y * 0.2), U * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  const hip = y - U * 0.42;
  const shoulder = y - U * 0.8;

  // kaki
  ctx.strokeStyle = '#1f2a44';
  ctx.lineWidth = U * 0.13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - U * 0.06, hip);
  ctx.lineTo(x - U * 0.06 + swing * U * 0.16, y - Math.max(0, swing) * U * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + U * 0.06, hip);
  ctx.lineTo(x + U * 0.06 - swing * U * 0.16, y - Math.max(0, -swing) * U * 0.1);
  ctx.stroke();

  // tas punggung
  rr(ctx, x - U * 0.26, y - U * 0.82, U * 0.18, U * 0.34, U * 0.05);
  ctx.fillStyle = '#f97316'; ctx.fill();

  // badan
  rr(ctx, x - U * 0.17, shoulder, U * 0.34, U * 0.4, U * 0.09);
  ctx.fillStyle = '#3b82f6'; ctx.fill();

  // lengan
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = U * 0.11;
  ctx.beginPath();
  ctx.moveTo(x - U * 0.15, shoulder + U * 0.06);
  ctx.lineTo(x - U * 0.15 - swing * U * 0.14, shoulder + U * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + U * 0.15, shoulder + U * 0.06);
  ctx.lineTo(x + U * 0.15 + swing * U * 0.14, shoulder + U * 0.3);
  ctx.stroke();

  // kepala
  ctx.fillStyle = '#ffd7b0';
  ctx.beginPath(); ctx.arc(x, y - U * 0.93, U * 0.14, 0, Math.PI * 2); ctx.fill();

  // topi
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(x, y - U * 0.96, U * 0.145, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#dc2626';
  rr(ctx, x - U * 0.02, y - U * 0.98, U * 0.24, U * 0.05, U * 0.02); ctx.fill();

  ctx.restore();
}

/* ==================== LOOP ==================== */
let last = performance.now();
function loop(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;
  if (G.shake > 0) {
    ctx.save();
    ctx.translate(rand(-G.shake, G.shake) * 0.4, rand(-G.shake, G.shake) * 0.4);
  }
  update(dt);
  updateParts(dt);
  if (G.mode !== 'paused') render();
  if (G.shake > 0) ctx.restore();
  requestAnimationFrame(loop);
}

/* ==================== TOAST ==================== */
let toastTimer = null;
function toast(msg, kind) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast ' + (kind || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 1800);
}

/* ==================== IMPORT SOAL ==================== */
function splitLine(line, d) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === d) { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}
function toIndex(ans, n) {
  if (Array.isArray(ans)) return ans.length ? toIndex(ans[0], n) : -1;
  if (typeof ans === 'number' && isFinite(ans)) {
    if (ans === 0) return 0;
    if (ans >= 1 && ans <= n) return ans - 1;
    return -1;
  }
  const s = String(ans).trim();
  if (!s) return -1;
  if (/^[1-9]\d*$/.test(s)) { const v = parseInt(s, 10); return v >= 1 && v <= n ? v - 1 : -1; }
  if (/^[A-Za-z]$/.test(s)) {
    const v = s.toUpperCase().charCodeAt(0) - 65;
    return v >= 0 && v < n ? v : -1;
  }
  return -1;
}
function normalizeAny(o) {
  if (!o) return null;
  const q = o.q || o.question || o.pertanyaan || o.soal;
  let opts = o.opts || o.options || o.opsi || o.pilihan;
  if (!Array.isArray(opts)) {
    opts = [o.opsi_a || o.a, o.opsi_b || o.b, o.opsi_c || o.c, o.opsi_d || o.d].filter(v => v != null && String(v).trim() !== '');
  }
  opts = opts.map(v => String(v).trim()).filter(Boolean);
  if (!q || opts.length < 2) return null;
  let ans = o.ans != null ? o.ans : (o.answer != null ? o.answer : o.jawaban);
  let idx = toIndex(ans, opts.length);
  if (idx < 0 && ans != null) {
    idx = opts.findIndex(x => x.toLowerCase() === String(ans).trim().toLowerCase());
  }
  if (idx < 0) return null;
  return { q: String(q).trim(), opts: opts, ans: idx, subj: String(o.subj || o.subject || o.subjek || 'Umum').trim(), src: 'impor' };
}
function parseQuestions(text) {
  const res = { list: [], errors: [] };
  const t = text.replace(/^\uFEFF/, '').trim();
  if (!t) { res.errors.push('Teks kosong.'); return res; }

  if (t[0] === '[' || t[0] === '{') {
    let data;
    try { data = JSON.parse(t); }
    catch (e) { res.errors.push('JSON tidak valid: ' + e.message); return res; }
    if (!Array.isArray(data)) data = [data];
    data.forEach((o, i) => {
      const n = normalizeAny(o);
      if (n) res.list.push(n); else res.errors.push('Baris JSON #' + (i + 1) + ' tidak valid (butuh question/options/answer).');
    });
    return res;
  }

  const lines = t.split(/\r?\n/).filter(l => l.trim() !== '');
  const head = lines[0] || '';
  const semi = (head.match(/;/g) || []).length;
  const coma = (head.match(/,/g) || []).length;
  const delim = semi >= coma ? ';' : ',';
  let rows = lines.map(l => splitLine(l, delim));
  const first = (rows[0][0] || '').toLowerCase();
  if (/pertanyaan|question|soal/.test(first)) rows = rows.slice(1);

  rows.forEach((cols, i) => {
    if (cols.length < 4) { res.errors.push('Baris ' + (i + 1) + ': kolom kurang dari 4.'); return; }
    const q = cols[0];
    const opts = cols.slice(1, 5).filter(v => v !== '');
    const ans = cols[5] != null ? cols[5] : '';
    const subj = cols[6] || 'Umum';
    const n = normalizeAny({ question: q, options: opts, answer: ans, subject: subj });
    if (n) res.list.push(n);
    else res.errors.push('Baris ' + (i + 1) + ': jawaban "' + ans + '" tidak cocok dengan opsi.');
  });
  return res;
}
function saveCustom(list) {
  const cur = store.get(LS.bank, []);
  const tagged = list.map(o => Object.assign({}, o, { kelas: G.kelas }));
  const merged = cur.concat(tagged);
  store.set(LS.bank, merged);
  buildBank();
}
function importText(text, origin) {
  const res = parseQuestions(text);
  const box = $('#importResult');
  if (res.list.length) saveCustom(res.list);
  let msg = '';
  if (res.list.length) msg += 'Berhasil impor ' + res.list.length + ' soal dari ' + origin + ' ke Kelas ' + G.kelas + '.\n';
  if (res.errors.length) msg += 'Dilewati ' + res.errors.length + ' baris:\n- ' + res.errors.slice(0, 6).join('\n- ');
  box.textContent = msg.trim() || 'Tidak ada soal yang terbaca.';
  box.className = 'result ' + (res.list.length ? 'ok' : 'err');
  renderBankList();
  refreshMenu();
}
function renderBankList() {
  const ul = $('#bankList');
  ul.innerHTML = '';
  G.bank.forEach(o => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="tag">${escapeHtml(o.subj)}</span><span class="qline">${escapeHtml(o.q)}<br><span class="src">${escapeHtml(o.opts[o.ans])} (benar) · ${o.src}</span></span>`;
    ul.appendChild(li);
  });
  $('#bankCount').textContent = G.bank.length;
  $('#bankKelas').textContent = G.kelas;
}
function refreshMenu() {
  $('#bestScore').textContent = store.get(LS.best, 0);
  const kelasCustom = store.get(LS.bank, []).filter(c => Number(c.kelas || G.kelas) === G.kelas).length;
  $('#bankInfo').textContent = G.bank.length + (kelasCustom ? ' (' + kelasCustom + ' impor)' : '');
  $('#intervalRange').value = G.interval;
  $('#intVal').textContent = G.interval;
  $('#kelasVal').textContent = G.kelas;
  Array.from($('#kelasSeg').children).forEach(b => b.classList.toggle('on', Number(b.dataset.kelas) === G.kelas));
  applyRoleUI();
  renderScores();
}
function downloadTemplate() {
  const csv = [
    'pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;jawaban;subjek',
    '"Berapa hasil 5 x 6?";25;30;35;40;B;Matematika',
    '"Ibu kota Jepang adalah?";Tokyo;Kyoto;Osaka;Sapporo;Tokyo;Geografi',
    '"12 + 27 = ?";39;49;38;37;1;Matematika'
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'template-soal.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ==================== INPUT ==================== */
function move(dir) {
  if (G.mode !== 'running') return;
  G.lane = clamp(G.lane + dir, -1, 1);
}
function jump() {
  if (G.mode !== 'running') return;
  if (G.y === 0) { G.vy = 3.5; }
}
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (G.mode === 'question') {
    if (['1', '2', '3', '4', '5', '6'].includes(k)) {
      const idx = parseInt(k, 10) - 1;
      const btn = $('#qOptions').children[idx];
      if (btn && !btn.disabled) answer(idx, btn);
      e.preventDefault();
    } else if (k === 'enter' || k === ' ') {
      if (G.answered) continueRun();
      e.preventDefault();
    }
    return;
  }
  if (k === 'arrowleft' || k === 'a') { move(-1); e.preventDefault(); }
  else if (k === 'arrowright' || k === 'd') { move(1); e.preventDefault(); }
  else if (k === 'arrowup' || k === 'w' || k === ' ') { jump(); e.preventDefault(); }
  else if (k === 'p') { G.mode === 'running' ? pauseGame() : resumeGame(); }
  else if (k === 'escape') { if (G.mode === 'running') pauseGame(); else if (G.mode === 'paused') resumeGame(); }
  else if (k === 'enter') { if (G.mode === 'menu') startGame(); else if (G.mode === 'over') startGame(); }
});

let tsX = 0, tsY = 0, tsT = 0;
canvas.addEventListener('touchstart', e => {
  const t = e.changedTouches[0];
  tsX = t.clientX; tsY = t.clientY; tsT = performance.now();
}, { passive: true });
canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - tsX, dy = t.clientY - tsY;
  if (performance.now() - tsT > 700) return;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { jump(); return; }
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
  else if (dy < 0) jump();
}, { passive: true });

/* ==================== UI WIRING ==================== */
$('#btnPlay').addEventListener('click', startGame);
$('#btnRestart').addEventListener('click', startGame);
$('#btnMenu').addEventListener('click', toMenu);
$('#btnQuit').addEventListener('click', toMenu);
$('#btnPause').addEventListener('click', pauseGame);
$('#btnResume').addEventListener('click', resumeGame);
$('#qBtnContinue').addEventListener('click', continueRun);

$('#kelasSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-kelas]');
  if (!b) return;
  G.kelas = clamp(parseInt(b.dataset.kelas, 10), 1, 6);
  store.set(LS.kelas, G.kelas);
  buildBank();
  refreshMenu();
  renderBankList();
  toast('Soal Kelas ' + G.kelas + ' siap dimainkan');
});
$('#intervalRange').addEventListener('input', e => {
  G.interval = parseInt(e.target.value, 10);
  $('#intVal').textContent = G.interval;
  store.set(LS.interval, G.interval);
});

/* ---- layar login ---- */
let loginRole = 'player';
$('#roleSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-role]');
  if (!b) return;
  loginRole = b.dataset.role;
  Array.from($('#roleSeg').children).forEach(x => x.classList.toggle('on', x.dataset.role === loginRole));
  $('#fPlayer').classList.toggle('hidden', loginRole !== 'player');
  $('#fAdmin').classList.toggle('hidden', loginRole !== 'admin');
  $('#loginError').textContent = '';
});
function doLogin() {
  const err = $('#loginError');
  const res = loginRole === 'admin'
    ? loginAdmin($('#loginUser').value, $('#loginPass').value)
    : loginPlayer($('#loginName').value);
  if (!res.ok) { err.textContent = res.msg; return; }
  err.textContent = '';
}
$('#btnLogin').addEventListener('click', doLogin);
$('#loginName').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
$('#loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
$('#btnLogout').addEventListener('click', () => { logout(); toast('Anda telah keluar'); });
$('#btnPass').addEventListener('click', () => {
  const v = $('#newPass').value.trim();
  const box = $('#passResult');
  if (v.length < 4) { box.textContent = 'Kata sandi minimal 4 karakter.'; box.className = 'result err'; return; }
  store.set(LS.admin, { user: adminCreds().user, pass: v });
  $('#newPass').value = '';
  box.textContent = 'Kata sandi admin berhasil diganti.';
  box.className = 'result ok';
});

function openImport() {
  $('#importModal').classList.remove('hidden');
  $('#importResult').textContent = '';
  $('#importResult').className = 'result';
  renderBankList();
}
$('#btnImport').addEventListener('click', openImport);
$('#btnBank').addEventListener('click', openImport);
$('#btnCloseImport').addEventListener('click', () => $('#importModal').classList.add('hidden'));
$('#btnTemplate').addEventListener('click', downloadTemplate);
$('#btnResetBank').addEventListener('click', () => {
  store.set(LS.bank, []);
  buildBank(); renderBankList(); refreshMenu();
  $('#importResult').textContent = 'Hasil impor dihapus. Bank kembali ke soal bawaan.';
  $('#importResult').className = 'result ok';
});
$('#btnPasteImport').addEventListener('click', () => {
  const v = $('#pasteArea').value;
  if (!v.trim()) { $('#importResult').textContent = 'Tempel dulu isi soalnya.'; $('#importResult').className = 'result err'; return; }
  importText(v, 'tempelan teks');
  $('#pasteArea').value = '';
});
function handleFile(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => importText(String(rd.result), file.name);
  rd.onerror = () => {
    $('#importResult').textContent = 'Gagal membaca file.';
    $('#importResult').className = 'result err';
  };
  rd.readAsText(file, 'utf-8');
}
$('#fileInput').addEventListener('change', e => { handleFile(e.target.files[0]); e.target.value = ''; });

const dz = $('#dropZone');
['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => { handleFile(e.dataTransfer.files[0]); });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

/* ==================== INIT ==================== */
buildBank();
renderBankList();
updateHud();
requestAnimationFrame(loop);

const savedSession = store.get(LS.session, null);
if (savedSession && savedSession.name) {
  AUTH.role = savedSession.role === 'admin' ? 'admin' : 'player';
  AUTH.name = savedSession.name;
  showMenu();
} else {
  G.mode = 'login';
  refreshMenu();
  renderScores();
}

function ensureLogin() {
  if (G.mode !== 'login') return;
  loginPlayer('Tamu');
}
if (location.hash === '#play') {
  ensureLogin();
  startGame();
  G.dist = 320;
  G.objs.push(
    { type: 'barrier', lane: -1, d: 15, hit: false },
    { type: 'barrier', lane: 1, d: 15, hit: false },
    { type: 'train', lane: 0, d: 30, len: 9, hit: false }
  );
  for (let i = 0; i < 5; i++) G.objs.push({ type: 'coin', lane: 0, d: 12 + i * 2.2, hit: false });
  updateHud();
}
if (location.hash === '#soal') { ensureLogin(); startGame(); openQuestion(); }
if (location.hash === '#impor') {
  const c = adminCreds();
  loginAdmin(c.user, c.pass);
  openImport();
}
