// Sternenspiel – Papier-Balance-Simulation 0.17.0 (eigenständig, gleiche Rechenregeln wie js/kern/kampf.js).
// Aufruf: node tools/balance-sim.js  → Matrix gleicher Kosten + Beispielkämpfe. Keine Forschung (Grundwerte).
"use strict";
const W = { // profil {e, m}, bypass = ignoriert Energiehülle
  gatling: { e: 0.3, m: 0.9 }, raketen: { e: 0.2, m: 1.1 }, laser: { e: 1.0, m: 0.45 }, ionen: { e: 1.5, m: 0.25 },
  plasma: { e: 1.0, m: 1.0 }, railgun: { e: 0, m: 1.0, bypass: true } };
const K = { RUNDEN: 6, SCHWELLE: 0.5, BONUS: 1.5, MALUS: 0.5, EMP_GRENZE_JE_STUFE: 1000, EMP_ZIELE_JE_STUFE: 25 };
const S = { // id: [kosten M+Si, verbund?, waffen, angriff, energie, wertKosten(M+Si+Öl)]
  aufklaerer: [3000, 0, { gatling: 1 }, 15, 0, 3500], kleine_drohne: [3000, 0, { gatling: .7, raketen: .3 }, 60, 0, 3000],
  mittlere_drohne: [6000, 0, { gatling: .5, raketen: .5 }, 120, 0, 6200], schwere_drohne: [11000, 0, { raketen: .6, gatling: .4 }, 200, 100, 11500],
  korvette: [15000, 0, { gatling: .5, laser: .5 }, 380, 300, 16000], fregatte: [24000, 0, { railgun: .5, laser: .5 }, 480, 500, 26000],
  zerstoerer: [32000, 0, { gatling: .6, laser: .4 }, 750, 700, 35000], kreuzer: [45000, 0, { ionen: .5, railgun: .5 }, 1000, 1100, 50000],
  bomber: [65000, 1, { plasma: .6, raketen: .4 }, 1000, 1600, 75000], schlachtkreuzer: [85000, 1, { laser: .6, railgun: .4 }, 1500, 3000, 97000],
  schlachtschiff: [90000, 1, { plasma: .5, railgun: .5 }, 1300, 3000, 105000], traeger: [120000, 1, { raketen: .6, laser: .4 }, 600, 4500, 140000],
  koloss: [650000, 1, { plasma: .6, ionen: .4 }, 8000, 20000, 750000], titan: [6000000, 1, { plasma: .6, railgun: .3, gatling: .1 }, 60000, 200000, 7000000, true],
  // Verteidigung
  maschinennest: [2000, 0, { gatling: 1 }, 40, 0, 2000], raketenbatterie: [2000, 0, { raketen: 1 }, 40, 0, 2000], laserturm: [2000, 0, { laser: 1 }, 130, 50, 2000],
  pulslaser: [8000, 0, { laser: .7, ionen: .3 }, 550, 200, 8000], magnetkanone: [35000, 0, { railgun: 1 }, 500, 800, 37000],
  ionengeschuetz: [8000, 0, { ionen: 1 }, 650, 500, 8000], plasmaturm: [100000, 0, { plasma: 1 }, 2200, 2500, 130000] };
const ARG = process.argv.slice(2);
function grp(id, n, emp) { const s = S[id], mj = s[0] / 10 * (s[1] ? 1.25 : 1); return { id, n, v: n, mj, ej: s[4], m: mj * n, e: s[4] * n, a: s[3], w: s[2], wert: s[5], emp: s[6] ? emp || 0 : 0 }; }
function dmg(x, t) { let e = 0, m = 0; const kaputt = t.e <= 1e-9;
  for (const w in x.w) { const p = W[w], f = x.a * x.w[w];
    if (p.bypass) { m += f * p.m * K.BONUS; continue; }
    e += f * p.e; m += f * p.m * (kaputt ? (p.m >= K.SCHWELLE ? K.BONUS : K.MALUS) : 1); }
  if (!(t.ej > 0)) e = 0; return { e, m }; }
function empSchlag(A, B, log) { A.filter((x) => x.emp && x.n > 0).forEach((x) => {
  let rest = x.n * K.EMP_ZIELE_JE_STUFE * x.emp, grenze = K.EMP_GRENZE_JE_STUFE * x.emp;
  B.filter((t) => t.n > 0 && t.ej > 0 && t.ej <= grenze).sort((a, b) => b.ej - a.ej).forEach((t) => {
    const anteil = Math.min(1, rest / t.n); if (anteil <= 0) return; rest -= Math.min(rest, t.n);
    t.e = t.e * (1 - anteil); if (log) log.push(`EMP: ${t.id} Energiehülle ${Math.round(anteil * 100)} % → 0`); }); }); }
function kampf(a, b, opt = {}) { const A = Object.entries(a).map(([id, n]) => grp(id, n, opt.empA)), B = Object.entries(b).map(([id, n]) => grp(id, n, opt.empB));
  const log = []; empSchlag(A, B, log); empSchlag(B, A, log);
  let r = 0; for (r = 1; r <= K.RUNDEN; r++) { const la = A.filter((x) => x.n > 0), lb = B.filter((x) => x.n > 0); if (!la.length || !lb.length) { r--; break; }
    const D = new Map(); const feuer = (von, zi) => { const sum = zi.reduce((s, t) => s + t.n, 0);
      von.forEach((q) => zi.forEach((t) => { const s = q.n * t.n / sum, d = dmg(q, t), o = D.get(t) || { e: 0, m: 0 }; o.e += s * d.e; o.m += s * d.m; D.set(t, o); })); };
    feuer(la, lb); feuer(lb, la);
    D.forEach((d, t) => { t.e = Math.max(0, t.e - d.e); t.m = Math.max(0, t.m - d.m); t.n = t.m <= 1e-6 ? 0 : Math.min(t.n, Math.ceil(t.m / t.mj - 1e-9)); t.e = Math.min(t.e, t.n * t.ej); }); }
  const verl = (L) => L.reduce((s, x) => s + (x.v - x.n) * x.wert, 0), ges = (L) => L.reduce((s, x) => s + x.v * x.wert, 0), rest = (L) => L.reduce((s, x) => s + x.n, 0);
  return { runden: Math.min(r, K.RUNDEN), restA: A.map((x) => x.id + ":" + x.n).join(" "), restB: B.map((x) => x.id + ":" + x.n).join(" "),
    verlA: verl(A) / ges(A), verlB: verl(B) / ges(B), sieger: !rest(A) && !rest(B) ? "beide tot" : !rest(A) ? "B" : !rest(B) ? "A" : "offen", log }; }
module.exports = { kampf, S, W, K };
if (require.main === module) {
  const BUDGET = Number(ARG[0]) || 2000000, ids = ["aufklaerer", "kleine_drohne", "mittlere_drohne", "schwere_drohne", "korvette", "fregatte", "zerstoerer", "kreuzer", "bomber", "schlachtkreuzer", "schlachtschiff", "traeger", "koloss"];
  const n = (id) => Math.max(1, Math.round(BUDGET / S[id][5]));
  console.log(`Matrix gleiche Kosten (${BUDGET}): Wert-Verlust Zeile − Spalte (negativ = Zeile gewinnt Tausch)`);
  console.log("".padEnd(16) + ids.map((x) => x.slice(0, 6).padStart(7)).join(""));
  const score = {};
  ids.forEach((a) => { let line = a.padEnd(16); score[a] = 0; ids.forEach((b) => { const r = kampf({ [a]: n(a) }, { [b]: n(b) }); const d = r.verlA - r.verlB; score[a] -= d; line += d.toFixed(2).padStart(7); }); console.log(line); });
  console.log("Summe (höher = kosteneffizienter):", Object.entries(score).map(([k, v]) => k + " " + v.toFixed(2)).join(" | "));
}
