'use strict';

/* ============================================================
   BANK SOAL OTOMATIS — Kurikulum Merdeka (Fase A / B / C)
   Mengisi BANK_BY_CLASS hingga 1000 soal per kelas.
   Deterministik (seed tetap): hasil selalu sama tiap dibuka.
   Data pendukung: soal-bahasa.js (kosakata) dan soal-fakta.js (fakta).
   ============================================================ */
const SOAL_GEN = (function () {
  const TARGET = 1000;
  const BUDGET = { eng: 150, syn: 95, ant: 95, fakta: 70 };

  const BAHASA = (typeof SOAL_BAHASA !== 'undefined' && SOAL_BAHASA) ? SOAL_BAHASA : { eng: {}, syn: {}, ant: {} };
  const FAKTA = (typeof SOAL_FAKTA !== 'undefined' && SOAL_FAKTA) ? SOAL_FAKTA : {};

  /* ---------------- PRNG deterministik ---------------- */
  function rngOf(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, a, b) => (b <= a ? a : a + Math.floor(r() * (b - a + 1)));
  const pick = (r, arr) => (arr && arr.length ? arr[Math.floor(r() * arr.length)] : null);
  function shuffle(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function fpb(a, b) { while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function kpk(a, b) { return a / fpb(a, b) * b; }
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  }

  /* ---------------- format angka Indonesia ---------------- */
  function idn(n) {
    const s = String(Math.abs(Math.round(n)));
    return (n < 0 ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function num(x, dp) {
    let s = Number(x).toFixed(dp == null ? 2 : dp);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }
  function rp(n) { return 'Rp' + idn(n); }
  function jam(m) {
    const h = Math.floor(m / 60) % 24;
    const mm = m % 60;
    return (h < 10 ? '0' : '') + h + '.' + (mm < 10 ? '0' : '') + mm;
  }
  function durasi(m) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h && mm) return h + ' jam ' + mm + ' menit';
    if (h) return h + ' jam';
    return mm + ' menit';
  }

  /* ---------------- penyusun soal ---------------- */
  function mk(r, q, correct, wrongs, subj) {
    const cs = String(correct);
    const seen = new Set([cs]);
    const w = [];
    for (let i = 0; i < (wrongs ? wrongs.length : 0); i++) {
      const s = String(wrongs[i]);
      if (!s || seen.has(s)) continue;
      seen.add(s);
      w.push(s);
    }
    if (w.length < 3) return null;
    const opts = shuffle(r, [cs].concat(shuffle(r, w).slice(0, 3)));
    return { q: q, opts: opts, ans: opts.indexOf(cs), subj: subj };
  }
  function mkI(r, q, c, ws, subj) {
    return mk(r, q, idn(c), (ws || []).map(idn), subj);
  }
  function wrongNums(r, c, min, max, k) {
    if (min == null) min = -Infinity;
    if (max == null) max = Infinity;
    const cnt = k || 6;
    const out = new Set();
    let guard = 0;
    while (out.size < cnt && guard++ < 400) {
      const span = Math.max(3, Math.abs(c));
      const mag = ri(r, 1, Math.max(2, Math.round(span * (0.15 + r() * 0.7))));
      const v = Math.round(c + (r() < 0.5 ? -mag : mag));
      if (v !== c && v >= min && v <= max) out.add(v);
    }
    let d = 1;
    while (out.size < cnt && d < 4000) {
      if (c + d <= max) out.add(c + d);
      if (out.size < cnt && c - d >= min) out.add(c - d);
      d++;
    }
    return Array.from(out);
  }
  function decWrongs(r, c, dp, k) {
    const scale = Math.pow(10, dp);
    const out = new Set();
    let d = 1;
    while (out.size < (k || 6) && d < 5000) {
      const up = Math.round((c + d / scale) * scale) / scale;
      const dn = Math.round((c - d / scale) * scale) / scale;
      out.add(up);
      if (dn >= 0) out.add(dn);
      d++;
    }
    return Array.from(out);
  }

  /* ---------------- kosakata & padanan kata ---------------- */
  const ENG_LABEL = { n: 'kata benda (noun)', v: 'kata kerja (verb)', adj: 'kata sifat (adjective)' };
  const ENG_PHRASE = [
    p => 'Apa arti kata "' + p[0] + '"?',
    p => 'Kata "' + p[0] + '" dalam bahasa Inggris artinya...',
    p => '"' + p[0] + '" dalam bahasa Inggris disebut...'
  ];
  function others(r, list, pair, idx) {
    const vals = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] === pair) continue;
      const v = list[i][idx];
      if (v != null && String(v) !== '') vals.push(v);
    }
    return shuffle(r, vals);
  }
  function engForm(r, list, subj) {
    if (!list || list.length < 5) return null;
    const p = pick(r, list);
    if (!p) return null;
    const mode = ri(r, 0, 3);
    if (mode < 3) return mk(r, ENG_PHRASE[mode](p), p[1], others(r, list, p, 1), subj);
    const t = pick(r, ['n', 'v', 'adj']);
    const right = list.filter(x => x[2] === t);
    const wrong = list.filter(x => x[2] !== t);
    if (!right.length || wrong.length < 3) return null;
    const rp2 = pick(r, right);
    return mk(r, 'Manakah yang termasuk ' + ENG_LABEL[t] + '?', rp2[0], shuffle(r, wrong.map(x => x[0])), subj);
  }
  function langForm(r, list, fwd, rev, subj, kelas) {
    if (!list || list.length < 5) return null;
    const p = pick(r, list);
    if (!p) return null;
    const useFwd = r() < 0.5;
    const tpls = useFwd ? fwd : rev;
    const ansIdx = useFwd ? 1 : 0;
    const even = kelas % 2 === 0;
    const ti = tpls.length > 1 && even ? ri(r, 1, tpls.length - 1) : 0;
    return mk(r, tpls[ti](p), p[ansIdx], others(r, list, p, ansIdx), subj);
  }
  const SYN_FWD = [p => 'Sinonim dari kata "' + p[0] + '" adalah...', p => 'Kata yang memiliki arti sama dengan "' + p[0] + '" adalah...'];
  const SYN_REV = [p => 'Padanan kata dari "' + p[1] + '" adalah...', p => 'Kata "' + p[1] + '" mempunyai arti sama dengan...'];
  const ANT_FWD = [p => 'Lawan kata dari kata "' + p[0] + '" adalah...', p => 'Kata yang berlawanan arti dengan "' + p[0] + '" adalah...'];
  const ANT_REV = [p => 'Kata "' + p[1] + '" berlawanan arti dengan...', p => 'Antonim dari kata "' + p[1] + '" adalah...'];
  function faktaForm(r, rows, subjFallback) {
    if (!rows || !rows.length) return null;
    const row = pick(r, rows);
    if (!row || row.length < 5) return null;
    return mk(r, row[0], row[1], [row[2], row[3], row[4]], row[5] || subjFallback || 'Umum');
  }

  /* ---------------- pabrik soal matematika ---------------- */
  const KONVERSI = [
    { f: 'm', t: 'cm', k: 100, v1: 1, v2: 50 },
    { f: 'km', t: 'm', k: 1000, v1: 1, v2: 25 },
    { f: 'kg', t: 'g', k: 1000, v1: 1, v2: 30 },
    { f: 'liter', t: 'ml', k: 1000, v1: 1, v2: 25 },
    { f: 'jam', t: 'menit', k: 60, v1: 1, v2: 12 },
    { f: 'menit', t: 'detik', k: 60, v1: 1, v2: 20 },
    { f: 'm\u00B3', t: 'liter', k: 1000, v1: 1, v2: 6 }
  ];
  const PRIMA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const PD = [[3, 5], [2, 7], [4, 5], [3, 4], [2, 9], [5, 6], [3, 8], [5, 8], [4, 9], [7, 10]];

  const M = {
    add(r, a1, a2, b1, b2) {
      const a = ri(r, a1, a2), b = ri(r, b1, b2), c = a + b;
      return mkI(r, a + ' + ' + b + ' = ?', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    sub(r, a1, a2, b1, b2) {
      const a = ri(r, a1, a2);
      const b = ri(r, b1, Math.min(b2, a - 1));
      if (b < 1) return null;
      const c = a - b;
      return mkI(r, a + ' - ' + b + ' = ?', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    mul(r, a1, a2, b1, b2) {
      const a = ri(r, a1, a2), b = ri(r, b1, b2), c = a * b;
      return mkI(r, a + ' x ' + b + ' = ?', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    mulSet(r, set, b1, b2) {
      const a = pick(r, set), b = ri(r, b1, b2), c = a * b;
      return mkI(r, a + ' x ' + b + ' = ?', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    div(r, b1, b2, q1, q2) {
      const b = ri(r, b1, b2), q = ri(r, q1, q2), a = b * q;
      return mkI(r, a + ' : ' + b + ' = ?', q, wrongNums(r, q, 1, null, 6), 'Matematika');
    },
    half(r, v1, v2) {
      const n = 2 * ri(r, Math.max(2, Math.ceil(v1 / 2)), Math.max(3, Math.floor(v2 / 2)));
      const c = n / 2;
      return mkI(r, 'Setengah dari ' + n + ' adalah...', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    fracOf(r, dens, n1, n2) {
      const d = pick(r, dens);
      const n = d * ri(r, n1, n2);
      const c = n / d;
      return mkI(r, '1/' + d + ' dari ' + n + ' adalah...', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    fracOfP(r, pairs, n1, n2) {
      const pair = pick(r, pairs);
      const p = pair[0], d = pair[1];
      const n = d * ri(r, n1, n2);
      const c = p * (n / d);
      return mkI(r, p + '/' + d + ' dari ' + idn(n) + ' adalah...', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    compare(r, v1, v2) {
      const vals = [];
      let guard = 0;
      while (vals.length < 4 && guard++ < 200) {
        const v = ri(r, v1, v2);
        if (vals.indexOf(v) < 0) vals.push(v);
      }
      if (vals.length < 4) return null;
      const big = r() < 0.5;
      const c = big ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      return mk(r, 'Bilangan mana yang paling ' + (big ? 'besar' : 'kecil') + '?',
        idn(c), vals.filter(v => v !== c).map(idn), 'Matematika');
    },
    after(r, v1, v2) {
      const n = ri(r, v1, v2);
      return mkI(r, 'Angka yang tepat setelah ' + n + ' adalah...', n + 1, wrongNums(r, n + 1, 0, null, 6), 'Matematika');
    },
    oddEven(r, v1, v2) {
      const wantOdd = r() < 0.5;
      let c = ri(r, v1, v2);
      if ((c % 2 === 1) !== wantOdd) c += 1;
      if (c > v2) c -= 2;
      const ws = [];
      let guard = 0;
      while (ws.length < 6 && guard++ < 300) {
        const v = ri(r, v1, v2);
        if ((v % 2 === 1) !== wantOdd && v !== c && ws.indexOf(v) < 0) ws.push(v);
      }
      if (ws.length < 3) return null;
      return mk(r, 'Bilangan ' + (wantOdd ? 'ganjil' : 'genap') + ' adalah...', idn(c), ws.map(idn), 'Matematika');
    },
    dozen(r, d1, d2) {
      const k = ri(r, d1, d2), c = k * 12;
      return mkI(r, k + ' lusin sama dengan...', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    moneyAdd(r, step, max) {
      const a = step * ri(r, 1, Math.max(1, Math.floor(max / step)));
      const b = step * ri(r, 1, Math.max(1, Math.floor(max / step)));
      const c = a + b;
      return mk(r, rp(a) + ' + ' + rp(b) + ' = ?', rp(c), wrongNums(r, c, 0, null, 6).map(rp), 'Matematika');
    },
    moneyBuy(r, step, max) {
      const a = step * ri(r, 4, Math.max(4, Math.floor(max / step)));
      const b = step * ri(r, 1, Math.max(1, Math.floor(a / step) - 1));
      const c = a - b;
      const tpl = pick(r, [
        'Ibu punya ' + rp(a) + ' lalu membeli barang seharga ' + rp(b) + '. Sisa uangnya...',
        'Di kotak ada ' + rp(a) + ', lalu dikeluarkan ' + rp(b) + '. Sisa uang dalam kotak...',
        'Andi menerima ' + rp(a) + ' dari Ayah, lalu membeli buku seharga ' + rp(b) + '. Uang sisa Andi...',
        'Sebuah toko menerima uang ' + rp(a) + ' lalu menyetor ' + rp(b) + ' ke bank. Sisa uang toko...'
      ]);
      return mk(r, tpl, rp(c), wrongNums(r, c, 0, null, 6).map(rp), 'Matematika');
    },
    timeAdd(r, h1, h2) {
      const h = ri(r, 0, 23), k = ri(r, h1, h2);
      const t = (h + k) % 24;
      const ws = [(t + 1) % 24, (t + 2) % 24, (t + 23) % 24, (t + 22) % 24];
      return mk(r, 'Pukul ' + jam(h * 60) + ' ditambah ' + k + ' jam menjadi...',
        jam(t * 60), ws.map(x => jam(x * 60)), 'Matematika');
    },
    timeDiff(r) {
      const m1 = ri(r, 6, 14) * 60 + pick(r, [0, 15, 30, 45]);
      const add = ri(r, 4, 40) * 15;
      const m2 = m1 + add;
      const ans = durasi(add);
      const ws = [add + 15, add - 15, add + 60, add - 60, add + 30, add - 30]
        .filter(x => x >= 0).map(durasi);
      return mk(r, 'Selisih pukul ' + jam(m1) + ' dan ' + jam(m2) + ' adalah...', ans, ws, 'Matematika');
    },
    lenAdd(r, unit, v1, v2) {
      const a = ri(r, v1, v2), b = ri(r, v1, v2), c = a + b;
      return mk(r, 'Hasil dari ' + a + ' ' + unit + ' + ' + b + ' ' + unit + ' adalah...',
        c + ' ' + unit, wrongNums(r, c, 0, null, 6).map(w => w + ' ' + unit), 'Matematika');
    },
    conv(r) {
      const c = pick(r, KONVERSI);
      const v = ri(r, c.v1, c.v2), ans = v * c.k;
      return mk(r, v + ' ' + c.f + ' sama dengan...', ans + ' ' + c.t,
        wrongNums(r, ans, 0, null, 6).map(w => w + ' ' + c.t), 'Matematika');
    },
    pattern(r, v1, v2, s1, s2) {
      const step = ri(r, s1, s2), start = ri(r, v1, v2);
      const terms = [];
      for (let i = 0; i < 5; i++) terms.push(start + step * i);
      const miss = ri(r, 1, 3);
      const c = terms[miss];
      const shown = terms.map((t, i) => (i === miss ? '?' : t)).join(', ');
      const ws = wrongNums(r, c, 0, null, 10).filter(w => terms.indexOf(w) < 0);
      if (ws.length < 3) return null;
      return mk(r, 'Lanjutkan pola bilangan berikut: ' + shown, idn(c), ws.map(idn), 'Matematika');
    },
    wordAdd(r, v1, v2) {
      const a = ri(r, v1, v2), b = ri(r, v1, v2), c = a + b;
      const tpl = pick(r, [
        'Adik memiliki ' + a + ' permen, lalu Ayah memberi ' + b + ' permen. Jumlah permen adik sekarang...',
        'Di keranjang ada ' + a + ' apel, kemudian ditambah ' + b + ' apel. Jumlah apel dalam keranjang...',
        'Rina membaca ' + a + ' halaman pada hari Senin dan ' + b + ' halaman pada hari Selasa. Total halaman yang dibaca...',
        'Di kelas ada ' + a + ' anak laki-laki dan ' + b + ' anak perempuan. Seluruh anak di kelas...'
      ]);
      return mkI(r, tpl, c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    wordSub(r, v1, v2) {
      const a = ri(r, v1, v2);
      const b = ri(r, 1, Math.max(1, Math.floor(a / 2)));
      if (b >= a) return null;
      const c = a - b;
      const tpl = pick(r, [
        'Di laci ada ' + a + ' kertas, lalu diambil ' + b + ' lembar. Sisa kertas dalam laci...',
        'Bu Sari memetik ' + a + ' cabai, lalu ' + b + ' cabai dijual. Cabai sisa Bu Sari...',
        'Ibu punya ' + a + ' ribu rupiah lalu membeli sayur. Harga sayur ' + b + ' ribu rupiah. Sisa uang Ibu...'
      ]);
      return mkI(r, tpl, c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    wordMul(r, a1, a2, b1, b2) {
      const a = ri(r, a1, a2), b = ri(r, b1, b2), c = a * b;
      const tpl = pick(r, [
        'Satu kardus berisi ' + b + ' butir telur. ' + a + ' kardus berisi telur sebanyak...',
        'Setiap baris terdiri dari ' + b + ' siswa. ' + a + ' baris berisi siswa sebanyak...',
        'Harga satu buku ' + rp(b) + '. ' + a + ' buku harganya...'
      ]);
      return mkI(r, tpl, c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    wordDiv(r, b1, b2, q1, q2) {
      const b = ri(r, b1, b2), q = ri(r, q1, q2), a = b * q;
      const tpl = pick(r, [
        a + ' permen dibagi rata kepada ' + b + ' anak. Tiap anak mendapat...',
        a + ' buah dimasukkan ke ' + b + ' keranjang dengan isi sama banyak. Tiap keranjang berisi...',
        'Bu Rina membeli ' + a + ' buku lalu membagikannya kepada ' + b + ' muridnya. Tiap murid menerima...'
      ]);
      return mkI(r, tpl, q, wrongNums(r, q, 1, null, 6), 'Matematika');
    },
    areaRect(r) {
      const p = ri(r, 4, 45), l = ri(r, 3, 35), c = p * l;
      return mk(r, 'Luas persegi panjang dengan panjang ' + p + ' cm dan lebar ' + l + ' cm adalah...',
        c + ' cm\u00B2', wrongNums(r, c, 0, null, 6).map(w => w + ' cm\u00B2'), 'Matematika');
    },
    perimRect(r) {
      const p = ri(r, 5, 45), l = ri(r, 4, 35), c = 2 * (p + l);
      const extra = [p + l, p * l].map(w => w + ' cm');
      return mk(r, 'Keliling persegi panjang dengan panjang ' + p + ' cm dan lebar ' + l + ' cm adalah...',
        c + ' cm', extra.concat(wrongNums(r, c, 0, null, 6).map(w => w + ' cm')), 'Matematika');
    },
    areaSquare(r) {
      const s = ri(r, 3, 35), c = s * s;
      return mk(r, 'Luas persegi dengan sisi ' + s + ' cm adalah...',
        c + ' cm\u00B2', wrongNums(r, c, 0, null, 6).map(w => w + ' cm\u00B2'), 'Matematika');
    },
    perimSquare(r) {
      const s = ri(r, 3, 35), c = 4 * s;
      return mk(r, 'Keliling persegi dengan sisi ' + s + ' cm adalah...',
        c + ' cm', wrongNums(r, c, 0, null, 6).map(w => w + ' cm'), 'Matematika');
    },
    areaTri(r) {
      const a = ri(r, 2, 40);
      let t = ri(r, 2, 40);
      if ((a * t) % 2 !== 0) t += 1;
      const c = a * t / 2;
      return mk(r, 'Luas segitiga dengan alas ' + a + ' cm dan tinggi ' + t + ' cm adalah...',
        c + ' cm\u00B2', wrongNums(r, c, 0, null, 6).map(w => w + ' cm\u00B2'), 'Matematika');
    },
    areaPar(r) {
      const a = ri(r, 4, 40), t = ri(r, 3, 30), c = a * t;
      return mk(r, 'Luas jajar genjang dengan alas ' + a + ' cm dan tinggi ' + t + ' cm adalah...',
        c + ' cm\u00B2', wrongNums(r, c, 0, null, 6).map(w => w + ' cm\u00B2'), 'Matematika');
    },
    perimCircle(r) {
      const k = ri(r, 1, 20), rad = 7 * k, c = 44 * k;
      return mk(r, 'Keliling lingkaran berjari-jari ' + rad + ' cm (pi = 22/7) adalah...',
        c + ' cm', wrongNums(r, c, 0, null, 6).map(w => w + ' cm'), 'Matematika');
    },
    areaCircle(r) {
      const pool = [2, 3, 4, 5, 6, 7, 10, 12, 15, 20];
      const rad = pick(r, pool);
      const area = v => Math.round(3.14 * v * v * 100) / 100;
      const c = area(rad);
      const ws = shuffle(r, pool.filter(v => v !== rad)).slice(0, 6).map(area);
      return mk(r, 'Luas lingkaran dengan jari-jari ' + rad + ' cm (pi = 3,14) adalah...',
        num(c, 2) + ' cm\u00B2', ws.map(v => num(v, 2) + ' cm\u00B2'), 'Matematika');
    },
    volume(r) {
      if (r() < 0.5) {
        const s = ri(r, 2, 20), c = s * s * s;
        return mk(r, 'Volume kubus dengan rusuk ' + s + ' cm adalah...',
          c + ' cm\u00B3', wrongNums(r, c, 0, null, 6).map(w => w + ' cm\u00B3'), 'Matematika');
      }
      const p = ri(r, 3, 25), l = ri(r, 3, 25), t = ri(r, 2, 20), c = p * l * t;
      return mk(r, 'Volume balok dengan panjang ' + p + ' cm, lebar ' + l + ' cm, dan tinggi ' + t + ' cm adalah...',
        c + ' cm\u00B3', wrongNums(r, c, 0, null, 6).map(w => w + ' cm\u00B3'), 'Matematika');
    },
    avg(r) {
      const m = ri(r, 4, 80);
      const vals = shuffle(r, [m - 3, m - 1, m + 1, m + 3]);
      return mkI(r, 'Rata-rata dari ' + vals.join(', ') + ' adalah...', m, wrongNums(r, m, 0, null, 6), 'Matematika');
    },
    median(r) {
      const m = ri(r, 6, 60);
      const vals = shuffle(r, [m - 4, m - 2, m, m + 2, m + 4]);
      return mkI(r, 'Median (nilai tengah) dari ' + vals.join(', ') + ' adalah...', m, wrongNums(r, m, 0, null, 6), 'Matematika');
    },
    modus(r) {
      const a = ri(r, 4, 50);
      const others = [];
      let guard = 0;
      while (others.length < 3 && guard++ < 200) {
        const v = ri(r, 4, 70);
        if (v !== a && others.indexOf(v) < 0) others.push(v);
      }
      if (others.length < 3) return null;
      const vals = shuffle(r, [a, a, others[0], others[1], others[2]]);
      return mkI(r, 'Modus dari bilangan ' + vals.join(', ') + ' adalah...',
        a, others.concat(wrongNums(r, a, 0, null, 6)), 'Matematika');
    },
    percent(r) {
      const p = pick(r, [10, 15, 20, 25, 30, 40, 50, 60, 75]);
      const n = 100 * ri(r, 1, 25);
      const c = p * n / 100;
      return mkI(r, p + '% dari ' + idn(n) + ' adalah...', c, wrongNums(r, c, 0, null, 6), 'Matematika');
    },
    algebra(r) {
      const x = ri(r, 2, 20), a = ri(r, 2, 9), b = ri(r, 1, 40), c = a * x + b;
      return mkI(r, 'Jika ' + a + 'x + ' + b + ' = ' + c + ', maka nilai x adalah...',
        x, wrongNums(r, x, 1, null, 6), 'Matematika');
    },
    negOps(r) {
      const mode = ri(r, 0, 2);
      let q, c;
      if (mode === 0) {
        const a = ri(r, 1, 40), b = ri(r, 1, 40);
        c = b - a;
        q = '-' + a + ' + ' + b + ' = ?';
      } else if (mode === 1) {
        const a = ri(r, 1, 50), b = ri(r, 1, 60);
        c = a - b;
        q = a + ' - ' + b + ' = ?';
      } else {
        const a = ri(r, 1, 30), b = ri(r, 1, 30);
        c = -(a + b);
        q = '-' + a + ' - ' + b + ' = ?';
      }
      return mkI(r, q, c, wrongNums(r, c, -300, 0, 6), 'Matematika');
    },
    lcmGcd(r) {
      let a = ri(r, 4, 60), b = ri(r, 4, 60);
      if (a === b) b = b + 3 > 60 ? b - 3 : b + 3;
      if (r() < 0.5) {
        const c = fpb(a, b);
        return mkI(r, 'FPB dari ' + a + ' dan ' + b + ' adalah...', c, wrongNums(r, c, 1, null, 6), 'Matematika');
      }
      const c = kpk(a, b);
      return mkI(r, 'KPK dari ' + a + ' dan ' + b + ' adalah...', c, wrongNums(r, c, Math.max(a, b), null, 6), 'Matematika');
    },
    prime(r) {
      const p = pick(r, PRIMA);
      const ws = [];
      let guard = 0;
      while (ws.length < 3 && guard++ < 300) {
        const v = ri(r, 4, 120);
        if (v !== p && !isPrime(v) && ws.indexOf(v) < 0) ws.push(v);
      }
      if (ws.length < 3) return null;
      const all = shuffle(r, [p].concat(ws));
      return mk(r, 'Bilangan prima di antara ' + all.join(', ') + ' adalah...',
        String(p), ws.map(String), 'Matematika');
    },
    roundPlace(r) {
      const place = pick(r, [10, 100, 1000]);
      const n = ri(r, place, place * 98);
      const c = Math.round(n / place) * place;
      const below = Math.floor(n / place) * place;
      const label = place === 10 ? 'puluhan' : place === 100 ? 'ratusan' : 'ribuan';
      return mkI(r, 'Bilangan ' + idn(n) + ' dibulatkan ke ' + label + ' terdekat adalah...',
        c, [below].concat(wrongNums(r, c, 0, null, 6)), 'Matematika');
    },
    angleType(r) {
      const tumpul = r() < 0.5;
      const a = tumpul ? ri(r, 91, 179) : ri(r, 1, 89);
      const label = tumpul ? 'tumpul' : 'lancip';
      const others = shuffle(r, ['lancip', 'siku-siku', 'tumpul', 'lurus'].filter(x => x !== label));
      return mk(r, 'Sudut sebesar ' + a + ' derajat termasuk sudut...', label, others, 'Matematika');
    },
    speed(r) {
      const v = ri(r, 20, 90), t = ri(r, 2, 8), d = v * t;
      const ws = wrongNums(r, v, 5, 400, 6).concat([d]).map(w => w + ' km/jam');
      return mk(r, 'Sebuah mobil menempuh jarak ' + d + ' km selama ' + t +
        ' jam. Kecepatan rata-rata mobil adalah...', v + ' km/jam', ws, 'Matematika');
    },
    fracAdd(r, dens) {
      const d1 = pick(r, dens), d2 = pick(r, dens);
      const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
      const nume = n1 * d2 + n2 * d1, deno = d1 * d2;
      const g = fpb(nume, deno);
      const c = (nume / g) + '/' + (deno / g);
      const ws = [
        (n1 + n2) + '/' + (d1 + d2),
        nume + '/' + deno,
        (n1 * n2) + '/' + (d1 * d2),
        (n1 + n2) + '/' + deno,
        Math.abs(n1 - n2) + '/' + Math.max(1, Math.abs(d1 - d2))
      ];
      return mk(r, n1 + '/' + d1 + ' + ' + n2 + '/' + d2 + ' = ?', c, ws, 'Matematika');
    },
    fracMul(r, dens) {
      const d1 = pick(r, dens), d2 = pick(r, dens);
      const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
      const nume = n1 * n2, deno = d1 * d2;
      const g = fpb(nume, deno);
      const c = (nume / g) + '/' + (deno / g);
      const ws = [
        nume + '/' + deno,
        (n1 + n2) + '/' + (d1 + d2),
        (n1 + n2) + '/' + deno,
        (n1 * d2 + n2 * d1) + '/' + deno,
        nume + '/' + (d1 + d2)
      ];
      return mk(r, n1 + '/' + d1 + ' x ' + n2 + '/' + d2 + ' = ?', c, ws, 'Matematika');
    },
    fracCompare(r, dens) {
      const vals = [];
      let guard = 0;
      while (vals.length < 4 && guard++ < 200) {
        const d = pick(r, dens), n = ri(r, 1, d - 1);
        const s = n + '/' + d;
        if (vals.indexOf(s) < 0) vals.push(s);
      }
      if (vals.length < 4) return null;
      const big = r() < 0.5;
      const parts = s => s.split('/').map(Number);
      let ci = 0;
      for (let i = 1; i < vals.length; i++) {
        const a = parts(vals[i]), b = parts(vals[ci]);
        if (big ? a[0] * b[1] > b[0] * a[1] : a[0] * b[1] < b[0] * a[1]) ci = i;
      }
      return mk(r, 'Pecahan mana yang paling ' + (big ? 'besar' : 'kecil') + '?',
        vals[ci], vals.filter((_, i) => i !== ci), 'Matematika');
    },
    decAdd(r) {
      const a = ri(r, 11, 199) / 10, b = ri(r, 11, 199) / 10;
      const c = Math.round((a + b) * 10) / 10;
      return mk(r, num(a, 1) + ' + ' + num(b, 1) + ' = ?', num(c, 1),
        decWrongs(r, c, 1, 6).map(v => num(v, 1)), 'Matematika');
    },
    decMul(r) {
      const a = ri(r, 11, 199) / 10, b = ri(r, 2, 25);
      const c = Math.round(a * b * 100) / 100;
      return mk(r, num(a, 1) + ' x ' + b + ' = ?', num(c, 2),
        decWrongs(r, c, 2, 6).map(v => num(v, 2)), 'Matematika');
    },
    decCompare(r) {
      const vals = [];
      let guard = 0;
      while (vals.length < 4 && guard++ < 200) {
        const s = num(ri(r, 1, 999) / (r() < 0.5 ? 10 : 100), 2);
        if (vals.indexOf(s) < 0) vals.push(s);
      }
      if (vals.length < 4) return null;
      const big = r() < 0.5;
      const key = s => Number(s.replace(',', '.'));
      let ci = 0;
      for (let i = 1; i < vals.length; i++) {
        if (big ? key(vals[i]) > key(vals[ci]) : key(vals[i]) < key(vals[ci])) ci = i;
      }
      return mk(r, 'Bilangan desimal mana yang paling ' + (big ? 'besar' : 'kecil') + '?',
        vals[ci], vals.filter((_, i) => i !== ci), 'Matematika');
    }
  };

  const DENS4 = [2, 3, 4, 5, 6, 8];
  const DENS6 = [2, 3, 4, 5, 6, 8, 10];
  const DENS12 = [3, 4, 5, 6, 8, 10, 12];

  const GENS = {
    1: [
      r => M.add(r, 1, 60, 1, 60),
      r => M.sub(r, 2, 60, 1, 30),
      r => M.mulSet(r, [2, 5, 10], 1, 10),
      r => M.div(r, 2, 10, 1, 10),
      r => M.half(r, 4, 40),
      r => M.fracOf(r, [2, 4], 3, 20),
      r => M.after(r, 5, 90),
      r => M.compare(r, 1, 99),
      r => M.oddEven(r, 1, 60),
      r => M.dozen(r, 1, 4),
      r => M.moneyAdd(r, 500, 10000),
      r => M.timeAdd(r, 1, 6),
      r => M.lenAdd(r, 'cm', 5, 90),
      r => M.pattern(r, 1, 30, 1, 6),
      r => M.wordAdd(r, 1, 30),
      r => M.wordSub(r, 5, 40),
      r => M.wordDiv(r, 2, 8, 2, 8)
    ],
    2: [
      r => M.add(r, 1, 99, 1, 99),
      r => M.sub(r, 10, 120, 1, 60),
      r => M.mulSet(r, [2, 3, 5, 10], 1, 10),
      r => M.mul(r, 2, 10, 2, 9),
      r => M.div(r, 2, 10, 1, 20),
      r => M.half(r, 4, 80),
      r => M.fracOf(r, [2, 4, 5], 3, 30),
      r => M.compare(r, 1, 500),
      r => M.oddEven(r, 1, 100),
      r => M.dozen(r, 1, 8),
      r => M.moneyAdd(r, 500, 50000),
      r => M.moneyBuy(r, 500, 50000),
      r => M.timeAdd(r, 1, 8),
      r => M.lenAdd(r, 'cm', 10, 200),
      r => M.pattern(r, 1, 50, 1, 9),
      r => M.wordAdd(r, 5, 60),
      r => M.wordSub(r, 10, 90),
      r => M.wordMul(r, 3, 12, 4, 25),
      r => M.perimSquare(r)
    ],
    3: [
      r => M.add(r, 50, 999, 50, 999),
      r => M.sub(r, 100, 999, 20, 500),
      r => M.mul(r, 3, 25, 2, 12),
      r => M.div(r, 3, 15, 3, 40),
      r => M.fracOf(r, [2, 3, 4, 5], 4, 40),
      r => M.fracCompare(r, DENS4),
      r => M.compare(r, 100, 9999),
      r => M.pattern(r, 1, 80, 2, 12),
      r => M.moneyBuy(r, 500, 200000),
      r => M.timeDiff(r),
      r => M.timeAdd(r, 1, 12),
      r => M.areaSquare(r),
      r => M.perimRect(r),
      r => M.areaRect(r),
      r => M.prime(r),
      r => M.conv(r),
      r => M.wordAdd(r, 20, 200),
      r => M.wordMul(r, 4, 15, 5, 30),
      r => M.wordDiv(r, 3, 12, 3, 25),
      r => M.dozen(r, 3, 20)
    ],
    4: [
      r => M.add(r, 500, 50000, 200, 20000),
      r => M.sub(r, 1000, 99999, 500, 50000),
      r => M.mul(r, 12, 99, 3, 20),
      r => M.div(r, 4, 25, 5, 60),
      r => M.fracOfP(r, PD, 5, 40),
      r => M.fracAdd(r, DENS6),
      r => M.fracCompare(r, DENS6),
      r => M.decAdd(r),
      r => M.decCompare(r),
      r => M.areaTri(r),
      r => M.areaRect(r),
      r => M.areaPar(r),
      r => M.angleType(r),
      r => M.timeDiff(r),
      r => M.conv(r),
      r => M.roundPlace(r),
      r => M.moneyBuy(r, 1000, 1000000),
      r => M.pattern(r, 5, 300, 3, 40),
      r => M.prime(r),
      r => M.wordAdd(r, 100, 2000)
    ],
    5: [
      r => M.add(r, 1000, 500000, 1000, 200000),
      r => M.sub(r, 5000, 900000, 1000, 400000),
      r => M.mul(r, 25, 199, 4, 25),
      r => M.div(r, 6, 40, 8, 99),
      r => M.fracAdd(r, DENS6),
      r => M.fracMul(r, DENS6),
      r => M.fracOfP(r, PD, 8, 60),
      r => M.decMul(r),
      r => M.decAdd(r),
      r => M.percent(r),
      r => M.avg(r),
      r => M.volume(r),
      r => M.areaTri(r),
      r => M.areaCircle(r),
      r => M.perimCircle(r),
      r => M.negOps(r),
      r => M.conv(r),
      r => M.moneyBuy(r, 5000, 5000000),
      r => M.roundPlace(r),
      r => M.median(r),
      r => M.modus(r),
      r => M.fracCompare(r, DENS6)
    ],
    6: [
      r => M.add(r, 5000, 900000, 1000, 500000),
      r => M.sub(r, 10000, 900000, 5000, 500000),
      r => M.mul(r, 50, 499, 6, 40),
      r => M.div(r, 8, 60, 12, 200),
      r => M.percent(r),
      r => M.algebra(r),
      r => M.negOps(r),
      r => M.volume(r),
      r => M.areaCircle(r),
      r => M.perimCircle(r),
      r => M.lcmGcd(r),
      r => M.fracMul(r, DENS12),
      r => M.fracCompare(r, DENS12),
      r => M.fracAdd(r, DENS12),
      r => M.avg(r),
      r => M.median(r),
      r => M.modus(r),
      r => M.speed(r),
      r => M.conv(r),
      r => M.decMul(r),
      r => M.decCompare(r),
      r => M.moneyBuy(r, 10000, 20000000),
      r => M.prime(r),
      r => M.wordAdd(r, 500, 50000),
      r => M.wordDiv(r, 4, 30, 5, 60)
    ]
  };

  /* ---------------- perakitan bank per kelas ---------------- */
  let seq = 0;
  function fallback(r) {
    const a = 400 + (seq++);
    const b = ri(r, 1, 99);
    return mkI(r, 'Berapa hasil dari ' + a + ' + ' + b + '?', a + b,
      wrongNums(r, a + b, 0, null, 6), 'Matematika');
  }
  function fill(r, push, count, gen) {
    let made = 0, tries = 0;
    while (made < count && tries < count * 80) {
      tries++;
      if (push(gen())) made++;
    }
  }
  function build(kelas) {
    const k = clampKelas(kelas);
    const fase = k <= 2 ? 'A' : (k <= 4 ? 'B' : 'C');
    const r = rngOf((0x9E3779B9 ^ (k * 2654435761)) >>> 0);
    const out = [];
    const seen = new Set();
    function push(it) {
      if (!it || typeof it.q !== 'string' || !it.q) return false;
      if (!Array.isArray(it.opts) || it.opts.length < 2) return false;
      if (!Number.isInteger(it.ans) || it.ans < 0 || it.ans >= it.opts.length) return false;
      if (seen.has(it.q)) return false;
      seen.add(it.q);
      out.push(it);
      return true;
    }
    const base = (typeof BANK_BY_CLASS !== 'undefined' && BANK_BY_CLASS && BANK_BY_CLASS[k]) || [];
    for (let i = 0; i < base.length; i++) {
      const b = base[i];
      push({ q: b.q, opts: b.opts.slice(), ans: b.ans, subj: b.subj || 'Umum' });
    }

    const eng = (BAHASA.eng && BAHASA.eng[fase]) || [];
    const syn = (BAHASA.syn && BAHASA.syn[fase]) || [];
    const ant = (BAHASA.ant && BAHASA.ant[fase]) || [];
    const fakta = FAKTA[k] || [];

    fill(r, push, BUDGET.eng, () => engForm(r, eng, 'B. Inggris'));
    fill(r, push, BUDGET.syn, () => langForm(r, syn, SYN_FWD, SYN_REV, 'B. Indonesia', k));
    fill(r, push, BUDGET.ant, () => langForm(r, ant, ANT_FWD, ANT_REV, 'B. Indonesia', k));
    fill(r, push, BUDGET.fakta, () => faktaForm(r, fakta));

    const gens = GENS[k] || GENS[1];
    let i = 0, miss = 0, guard = 0;
    while (out.length < TARGET && guard++ < 500000) {
      const it = gens[i++ % gens.length](r, out.length);
      if (push(it)) { miss = 0; continue; }
      miss++;
      if (miss > 40) {
        if (push(fallback(r))) miss = 0;
      }
    }
    return out;
  }
  function clampKelas(v) {
    const n = parseInt(v, 10);
    if (!isFinite(n)) return 1;
    return Math.min(6, Math.max(1, n));
  }

  return { build: build, TARGET: TARGET };
})();

(function (B) {
  if (!B) return;
  for (let k = 1; k <= 6; k++) B[k] = SOAL_GEN.build(k);
})(typeof BANK_BY_CLASS !== 'undefined' ? BANK_BY_CLASS : null);
