const fs = require('fs');
const path = require('path');
const vm = require('vm');

let clock = 0;
let rafCb = null;

function makeEl(id, tag) {
  const classes = new Set();
  const handlers = {};
  const el = {
    id: id || null,
    tag: tag || 'div',
    children: [],
    dataset: {},
    disabled: false,
    value: '',
    files: [],
    href: '',
    textContent: '',
    offsetWidth: 100,
    _html: '',
    handlers: handlers,
    style: {},
    classList: null,
    addEventListener(t, fn) { (handlers[t] = handlers[t] || []).push(fn); },
    removeEventListener() {},
    dispatch(t, ev) { (handlers[t] || []).forEach(fn => fn(Object.assign({ target: el, preventDefault() {}, stopPropagation() {} }, ev))); },
    appendChild(c) { this.children.push(c); return c; },
    focus() {},
    click() { this.dispatch('click', {}); },
    closest() { return null; }
  };
  Object.defineProperty(el, 'className', {
    get() { return Array.from(classes).join(' '); },
    set(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); }
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = String(v); if (v === '') el.children.length = 0; }
  });
  const cl = {
    add: (...c) => c.forEach(x => classes.add(x)),
    remove: (...c) => c.forEach(x => classes.delete(x)),
    contains: c => classes.has(c),
    toggle(c, force) {
      const want = force === undefined ? !classes.has(c) : !!force;
      want ? classes.add(c) : classes.delete(c);
      return want;
    }
  };
  el.classList = cl;
  return el;
}

const els = {};
function getEl(sel) {
  const id = sel.replace(/^#/, '');
  if (!els[id]) els[id] = makeEl(id);
  return els[id];
}

// elemen awal sesuai index.html
['hud', 'questionModal', 'importModal', 'pauseModal', 'gameOver', 'toast'].forEach(id => {
  const e = getEl(id);
  if (id === 'toast') e.classList.add('toast', 'hidden');
  else e.classList.add('modal', 'hidden');
});
getEl('menu').classList.add('screen', 'hidden');
getEl('qOptions').classList.add('options');

const ctxStub = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 0 });
    if (!(p in t)) t[p] = () => undefined;
    return t[p];
  },
  set(t, p, v) { t[p] = v; return true; }
});

const canvasEl = makeEl('game', 'canvas');
canvasEl.getContext = () => ctxStub;
canvasEl.width = 0; canvasEl.height = 0;
els['game'] = canvasEl;

const documentStub = {
  querySelector: sel => getEl(sel),
  querySelectorAll: () => [],
  createElement: tag => makeEl(null, tag),
  addEventListener(t, fn) { (this._h = this._h || {})[t] = fn; },
  body: makeEl('body')
};

const sandbox = {
  document: documentStub,
  window: { innerWidth: 1280, innerHeight: 760, devicePixelRatio: 1, addEventListener() {} },
  location: { hash: '' },
  performance: { now: () => clock },
  requestAnimationFrame: cb => { rafCb = cb; return 1; },
  cancelAnimationFrame() {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: (() => {
    const m = {};
    return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
  })(),
  console
};
sandbox.window.document = documentStub;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['soal.js', 'soal-bahasa.js', 'soal-fakta.js', 'soal-gen.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), sandbox, { filename: f });
});
const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
vm.runInContext(src, sandbox, { filename: 'game.js' });

const run = code => vm.runInContext(code, sandbox);
function frames(n, ms) {
  for (let i = 0; i < n; i++) {
    clock += ms || 16.7;
    const cb = rafCb; rafCb = null;
    if (cb) cb(clock);
    if (!rafCb) rafCb = cb;
  }
}

let fail = 0;
function ok(cond, msg) { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; }

/* ---------- 1. login, menu & bank ---------- */
const expectedBank = run('BANK_BY_CLASS[G.kelas].length');
ok(run('G.mode') === 'login', 'layar login tampil di awal');
ok(getEl('menu').classList.contains('hidden'), 'menu tersembunyi sebelum masuk');

ok(run('loginPlayer("").ok') === false, 'nama kosong ditolak');
ok(run('loginAdmin("admin","salah").ok') === false, 'password admin salah ditolak');
ok(run('loginAdmin("admin","admin123").ok') === true, 'login admin dengan sandi bawaan berhasil');
run('logout()');
ok(run('G.mode') === 'login', 'logout kembali ke layar login');
ok(run('loginPlayer("Budi").ok') === true, 'pemain masuk cukup dengan nama');
ok(!getEl('menu').classList.contains('hidden'), 'menu tampil setelah login');
ok(getEl('login').classList.contains('hidden'), 'layar login disembunyikan');
ok(run('isAdmin()') === false, 'pemain bukan admin');
ok(getEl('btnBank').classList.contains('hidden'), 'pemain TIDAK melihat tombol LIHAT BANK SOAL');
ok(getEl('bankChip').classList.contains('hidden'), 'pemain TIDAK melihat chip BANK SOAL');
ok(getEl('intervalField').classList.contains('hidden'), 'pemain TIDAK melihat slider jeda berhenti');

/* akses berdasarkan peran */
run('logout(); loginAdmin("admin", adminCreds().pass);');
ok(!getEl('btnImport').classList.contains('hidden'), 'admin melihat tombol kelola soal');
ok(!getEl('adminTools').classList.contains('hidden'), 'admin melihat perangkat impor');
ok(!getEl('btnBank').classList.contains('hidden'), 'admin melihat tombol LIHAT BANK SOAL');
ok(!getEl('bankChip').classList.contains('hidden'), 'admin melihat chip BANK SOAL');
ok(!getEl('intervalField').classList.contains('hidden'), 'admin melihat slider jeda berhenti');
run('logout(); loginPlayer("Budi");');
ok(getEl('btnImport').classList.contains('hidden'), 'pemain TIDAK melihat tombol kelola soal');
ok(getEl('adminTools').classList.contains('hidden'), 'pemain TIDAK melihat perangkat impor');
ok(getEl('btnBank').classList.contains('hidden'), 'pemain TIDAK melihat tombol LIHAT BANK SOAL');
ok(getEl('bankChip').classList.contains('hidden'), 'pemain TIDAK melihat chip BANK SOAL');
ok(getEl('intervalField').classList.contains('hidden'), 'pemain TIDAK melihat slider jeda berhenti');
ok(getEl('whoami').innerHTML.indexOf('Budi') >= 0, 'menu menampilkan nama pemain');

/* ---------- 0b. bank 1000 soal per kelas ---------- */
for (let k = 1; k <= 6; k++) {
  const bank = run('BANK_BY_CLASS[' + k + ']');
  ok(bank.length === 1000, 'kelas ' + k + ' berisi 1000 soal (' + bank.length + ')');
  const bad = bank.filter(x => !x || !x.q || !Array.isArray(x.opts) || x.opts.length !== 4 ||
    !Number.isInteger(x.ans) || x.ans < 0 || x.ans > 3 || !x.subj);
  const dup = bank.length - new Set(bank.map(x => x.q)).size;
  ok(bad.length === 0 && dup === 0, 'kelas ' + k + ': semua soal valid, unik, 4 opsi (' + bad.length + ' cacat, ' + dup + ' dup)');
}

ok(getEl('bankInfo').textContent.indexOf(String(expectedBank)) >= 0, 'menu: bank soal kelas 1 = ' + expectedBank + ' (' + getEl('bankInfo').textContent + ')');
ok(String(getEl('bankCount').textContent) === String(expectedBank), 'daftar bank berisi ' + expectedBank + ' soal');

/* ganti kelas mengganti bank soal */
const bankKelas5 = run('(G.kelas = 5, store.set(LS.kelas, 5), buildBank(), refreshMenu(), renderBankList(), G.bank.length)');
ok(bankKelas5 === run('BANK_BY_CLASS[5].length'), 'pindah ke kelas 5 memakai bank kelas 5 (' + bankKelas5 + ' soal)');
ok(String(getEl('bankKelas').textContent) === '5', 'judul daftar bank menampilkan kelas 5');
run('G.kelas = 1; store.set(LS.kelas, 1); buildBank(); refreshMenu();');

/* ---------- 2. mulai & lari ---------- */
run('startGame()');
ok(run('G.mode') === 'running', 'mode berjalan setelah start');
ok(!getEl('menu').classList.contains('hidden') === false, 'menu disembunyikan');
ok(!getEl('hud').classList.contains('hidden'), 'HUD tampil');

frames(120);
const dist1 = Number(run('G.dist'));
ok(dist1 > 20, 'jarak bertambah (' + dist1.toFixed(1) + ' m)');
ok(Number(run('G.time')) > 1, 'waktu bertambah');
ok(getEl('hudDist').textContent.indexOf('M') > 0, 'HUD jarak ter-update: ' + getEl('hudDist').textContent);

/* ---------- 3. spawn rintangan & koin ---------- */
run('spawnPattern(); spawnPattern();');
frames(90);
ok(run('G.objs.length') > 0, 'objek spawn di jalan (' + run('G.objs.length') + ')');
ok(run('G.objs.some(o => o.type === "coin")'), 'ada koin');

/* ---------- 4. koin terkumpul ---------- */
const coinsBefore = run('G.coins');
run('G.objs.push({type:"coin", lane: G.lane, d: PLAYER_D + 0.1, hit:false})');
frames(20);
ok(run('G.coins') === coinsBefore + 1, 'koin terkumpul saat dilewati');

/* ---------- 5. tabrakan penghalang ---------- */
run('G.invuln = 0; G.objs.push({type:"barrier", lane: G.lane, d: PLAYER_D + 0.1, hit:false})');
const livesBefore = run('G.lives');
frames(20);
ok(run('G.lives') === livesBefore - 1, 'nyawa berkurang saat menabrak penghalang');
ok(run('G.mode') === 'running', 'masih berjalan setelah 1 tabrakan (invuln)');

/* ---------- 6. berhenti mengerjakan soal ---------- */
run('G.nextQ = G.dist + 2');
let guard = 0;
while (run('G.mode') !== 'question' && guard++ < 200) frames(1);
ok(run('G.mode') === 'question', 'game berhenti untuk mengerjakan soal');
ok(!getEl('questionModal').classList.contains('hidden'), 'modal soal tampil');
const optCount = getEl('qOptions').children.length;
ok(optCount >= 2, 'opsi tersedia: ' + optCount);
ok(getEl('qText').textContent.length > 3, 'teks soal tampil: ' + getEl('qText').textContent.slice(0, 40));
const distAtQ = run('G.dist');
frames(30);
ok(run('G.dist') === distAtQ, 'jarak tidak berubah saat mengerjakan soal');

/* salah = ulangi dari awal */
const ans = run('G.current.ans');
const wrongIdx = ans === 0 ? 1 : 0;
getEl('qOptions').children[wrongIdx].dispatch('click', {});
ok(run('G.mode') === 'wrong', 'jawaban salah: permainan disiapkan untuk diulang');
ok(getEl('qOptions').children[wrongIdx].disabled, 'jawaban salah dinonaktifkan');
ok(getEl('qFeedback').className.indexOf('bad') >= 0, 'umpan balik salah tampil');
ok(getEl('qFeedback').textContent.indexOf('ulangi dari awal') >= 0, 'pesan ulangi dari awal: ' + getEl('qFeedback').textContent);
ok(getEl('qBtnContinue').classList.contains('hidden'), 'tombol lanjut tidak muncul');
ok(run('G.miss') === 1, 'terhitung 1 jawaban salah');

guard = 0;
while (run('G.mode') === 'wrong' && guard++ < 300) frames(1);
ok(run('G.mode') === 'running', 'setelah salah, permainan berjalan lagi dari awal');
ok(getEl('questionModal').classList.contains('hidden'), 'modal soal ditutup saat ulang');
ok(run('G.dist') < 5, 'jarak diulangi dari awal (' + Number(run('G.dist')).toFixed(1) + ' m)');
ok(run('G.score') === 0, 'skor direset ke 0');
ok(run('G.lives') === run('levelOf(G.kelas).lives'), 'nyawa direset penuh (' + run('G.lives') + ')');

/* benar */
run('G.nextQ = G.dist + 2');
guard = 0;
while (run('G.mode') !== 'question' && guard++ < 200) frames(1);
ok(run('G.mode') === 'question', 'soal baru muncul setelah diulang');
const ans2 = run('G.current.ans');
getEl('qOptions').children[ans2].dispatch('click', {});
ok(run('G.answered') === true, 'jawaban benar diterima');
ok(!getEl('qBtnContinue').classList.contains('hidden'), 'tombol lanjut muncul');
ok(getEl('qFeedback').className.indexOf('good') >= 0, 'umpan balik benar tampil');
ok(run('G.mode') === 'question', 'masih berhenti sampai tekan lanjut');

getEl('qBtnContinue').dispatch('click', {});
ok(run('G.mode') === 'running', 'lari dilanjutkan setelah benar');
ok(run('G.nextQ') > run('G.dist'), 'soal berikutnya dijadwalkan lebih jauh');
ok(getEl('questionModal').classList.contains('hidden'), 'modal soal ditutup');

/* ---------- 7. pertanyaan berikutnya muncul lagi ---------- */
run('G.nextQ = G.dist + 2');
guard = 0;
while (run('G.mode') !== 'question' && guard++ < 200) frames(1);
ok(run('G.mode') === 'question', 'soal kedua muncul pada waktunya');
run('G.answered = true; continueRun()');

/* ---------- 8. jeda ---------- */
run('pauseGame()');
const dPause = run('G.dist');
frames(30);
ok(run('G.mode') === 'paused' && run('G.dist') === dPause, 'jeda menghentikan permainan');
run('resumeGame()');
frames(10);
ok(run('G.mode') === 'running', 'lanjut dari jeda');

/* ---------- 9. game over ---------- */
run('G.lives = 1; G.invuln = 0; G.objs.push({type:"barrier", lane: G.lane, d: PLAYER_D + 0.1, hit:false})');
guard = 0;
while (run('G.mode') === 'running' && guard++ < 200) frames(1);
ok(run('G.mode') === 'over', 'permainan selesai saat nyawa habis');
ok(!getEl('gameOver').classList.contains('hidden'), 'layar selesai tampil');
ok(getEl('goStats').innerHTML.indexOf('Akurasi') >= 0, 'statistik akurasi ditampilkan');
ok(Number(run('G.score')) > 0, 'skor terhitung');

/* ---------- 10. main lagi & ke menu ---------- */
run('startGame()');
ok(run('G.mode') === 'running' && run('G.lives') === run('levelOf(G.kelas).lives'), 'restart mereset nyawa sesuai kelas');
run('toMenu()');
ok(run('G.mode') === 'menu' && !getEl('menu').classList.contains('hidden'), 'kembali ke menu');

/* ---------- 11. import soal ---------- */
const bankBefore = run('G.bank.length');
const csv = 'pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;jawaban;subjek\n"5 x 5?";20;25;30;35;B;Matematika\n"1 + 8?";7;8;9;10;C;Matematika';
run('importText(' + JSON.stringify(csv) + ', "uji.csv")');
ok(run('G.bank.length') === bankBefore + 2, 'impor CSV menambah 2 soal (' + run('G.bank.length') + ')');
ok(getEl('importResult').className.indexOf('ok') >= 0, 'pesan sukses impor tampil');
ok(String(getEl('bankCount').textContent) === String(run('G.bank.length')), 'daftar bank ikut ter-update');

const bad = 'pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;jawaban;subjek\n"rusak";a;b;c;d;ZZ;Umum';
run('importText(' + JSON.stringify(bad) + ', "uji2.csv")');
ok(run('G.bank.length') === bankBefore + 2, 'baris rusak tidak mengubah bank');

const json = JSON.stringify([{ question: 'Pilih benar', options: ['salah', 'benar'], answer: 1, subject: 'Uji' }]);
run('importText(' + JSON.stringify(json) + ', "uji.json")');
ok(run('G.bank.length') === bankBefore + 3, 'impor JSON menambah 1 soal');
ok(run('G.bank.filter(x => x.src === "impor").length') === 3, 'soal impor ditandai');

run('store.set(LS.bank, []); buildBank(); refreshMenu();');
ok(run('G.bank.length') === run('BANK_BY_CLASS[1].length'), 'reset bank kembali ke soal bawaan kelas 1');

/* ---------- 12. soal impor dipakai di permainan ---------- */
run('startGame(); G.nextQ = G.dist + 2;');
guard = 0;
while (run('G.mode') !== 'question' && guard++ < 200) frames(1);
ok(run('G.mode') === 'question', 'soal dari bank dipakai saat lari');
run('G.answered = true; continueRun(); toMenu();');

console.log(fail ? '\n' + fail + ' GAGAL' : '\nSEMUA LOLOS');
process.exit(fail ? 1 : 0);

