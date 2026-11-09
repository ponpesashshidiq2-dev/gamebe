const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(code.slice(code.indexOf('const DEFAULT_QUESTIONS'), code.indexOf('/* ==================== PENYIMPANAN')).replace('const DEFAULT_QUESTIONS', 'globalThis.DEFAULT_QUESTIONS'));
eval(code.slice(code.indexOf('function splitLine'), code.indexOf('function saveCustom')));

let fail = 0;
function ok(cond, msg) { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; }

const csv = [
  'pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;jawaban;subjek',
  '"Berapa hasil 9 x 7?";56;63;72;81;B;Matematika',
  '"1+1";2;3;4;5;1;Matematika',
  '"ibu kota";Jakarta;Bandung;Surabaya;Medan;Jakarta;Geografi',
  '"kosong";a;b;c;d;;Umum'
].join('\n');
let r = parseQuestions(csv);
ok(r.list.length === 3, 'CSV: 3 soal valid (dapat ' + r.list.length + ')');
ok(r.errors.length === 1, 'CSV: 1 error kosong (dapat ' + r.errors.length + ')');
ok(r.list[0].ans === 1, 'CSV: jawaban B -> index 1 (' + r.list[0].ans + ')');
ok(r.list[1].ans === 0, 'CSV: jawaban 1 -> index 0 (' + r.list[1].ans + ')');
ok(r.list[2].ans === 0, 'CSV: jawaban teks -> index 0 (' + r.list[2].ans + ')');
ok(r.list[0].subj === 'Matematika', 'CSV: subjek terbaca');

const comma = 'question,option_a,option_b,option_c,option_d,answer\n"1+1=?",2,3,4,5,A\n"2+2=?",4,5,6,7,1';
r = parseQuestions(comma);
ok(r.list.length === 2, 'CSV koma: 2 soal (dapat ' + r.list.length + ')');

const js = JSON.stringify([
  { question: 'x?', options: ['a', 'b', 'c'], answer: 0, subject: 'Matematika' },
  { pertanyaan: 'y?', opsi: ['p', 'q'], jawaban: 'q', subjek: 'IPA' },
  { question: 'z?', options: ['m', 'n'], answer: 9 }
]);
r = parseQuestions(js);
ok(r.list.length === 2, 'JSON: 2 soal valid (dapat ' + r.list.length + ')');
ok(r.errors.length === 1, 'JSON: 1 error jawaban di luar opsi');
ok(r.list[1].ans === 1, 'JSON: jawaban teks -> index 1 (' + r.list[1].ans + ')');

r = parseQuestions('bukan json {rusak');
ok(r.list.length === 0 && r.errors.length > 0, 'teks rusak -> error, tanpa crash');
r = parseQuestions('');
ok(r.errors.length > 0, 'teks kosong -> error');

// normalisasi soal bawaan
const def = DEFAULT_QUESTIONS;
ok(def.every(q => q.ans >= 0 && q.ans < q.opts.length), 'semua soal bawaan: ans valid');
ok(def.every(q => q.opts.length >= 2), 'semua soal bawaan: minimal 2 opsi');

console.log(fail ? '\n' + fail + ' GAGAL' : '\nSEMUA LOLOS');
process.exit(fail ? 1 : 0);
