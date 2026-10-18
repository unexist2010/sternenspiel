// Erzeugt ALLE Grafiken des Sternenspiels als eigene SVG-Dateien unter assets/ (keine fremden Assets).
// Deterministisch (gleiche Ausgabe bei jedem Lauf). Aufruf: node tools/erzeuge-grafiken.js
const fs = require("fs");
const path = require("path");
const ASSETS = path.join(__dirname, "..", "assets");

function zufall(saat) { let a = saat >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function schreibe(rel, inhalt) { const p = path.join(ASSETS, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, inhalt.trim() + "\n"); console.log("  " + rel + " (" + inhalt.length + " B)"); }
const svg = (w, h, inhalt, extra = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${inhalt}</svg>`;
const f = (n) => Math.round(n * 10) / 10;

// ---------- Sternenhimmel-Hintergrund ----------
(function () {
  const r = zufall(2026), W = 1600, H = 1000;
  let sterne = "";
  for (let i = 0; i < 520; i++) {
    const x = f(r() * W), y = f(r() * H), gross = r() < 0.06, rad = gross ? f(1.1 + r() * 0.9) : f(0.3 + r() * 0.7);
    const farbe = ["#ffffff", "#cfe8ff", "#a8d8ff", "#fff3d6", "#bff7ff"][Math.floor(r() * 5)];
    sterne += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${farbe}" opacity="${f(0.35 + r() * 0.65)}"/>`;
    if (gross && r() < 0.5) sterne += `<path d="M${x - rad * 4} ${y}H${x + rad * 4}M${x} ${y - rad * 4}V${y + rad * 4}" stroke="${farbe}" stroke-width="0.4" opacity="0.5"/>`;
  }
  schreibe("hintergrund/sternenhimmel.svg", svg(W, H, `
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#06112a"/><stop offset="0.55" stop-color="#030816"/><stop offset="1" stop-color="#01040c"/></linearGradient>
  <radialGradient id="n1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#1b6f9a" stop-opacity="0.45"/><stop offset="0.6" stop-color="#103d6a" stop-opacity="0.18"/><stop offset="1" stop-color="#0a1a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="n2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#1fb8b0" stop-opacity="0.28"/><stop offset="1" stop-color="#0a3a4a" stop-opacity="0"/></radialGradient>
  <radialGradient id="n3" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#3a3fa8" stop-opacity="0.3"/><stop offset="1" stop-color="#14185a" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<ellipse cx="1180" cy="260" rx="520" ry="300" fill="url(#n1)" transform="rotate(-18 1180 260)"/>
<ellipse cx="1320" cy="380" rx="300" ry="160" fill="url(#n2)" transform="rotate(-25 1320 380)"/>
<ellipse cx="300" cy="820" rx="460" ry="220" fill="url(#n3)" transform="rotate(12 300 820)"/>
<ellipse cx="220" cy="760" rx="220" ry="110" fill="url(#n2)"/>
${sterne}`, ' preserveAspectRatio="xMidYMid slice"'));
})();

// ---------- Planeten (rein optische Typen, keine Größen) ----------
const PLANETEN = {
  lava:    { a: "#ffb347", b: "#c2410c", c: "#3b0a02", deko: (r) => adern(r, "#ffd166") },
  wueste:  { a: "#f6d58e", b: "#c98a3c", c: "#4a2a0a", deko: (r) => baender(r, "#e0a85a", 4, 0.35) },
  gestein: { a: "#c9c3b8", b: "#7d7468", c: "#24201b", deko: (r) => krater(r) },
  ozean:   { a: "#7fe3ff", b: "#1f6fbf", c: "#061a3c", deko: (r) => kontinente(r) },
  gas:     { a: "#ffe2b8", b: "#c98b5a", c: "#3a1e10", deko: (r) => baender(r, "#a8653a", 7, 0.5) },
  eis:     { a: "#ffffff", b: "#9fd8f0", c: "#1d4a66", deko: (r) => krater(r, "#d8f4ff") }
};
function baender(r, farbe, n, op) { let s = ""; for (let i = 0; i < n; i++) { const y = f(14 + r() * 36), h = f(1.5 + r() * 4); s += `<rect x="0" y="${y}" width="64" height="${h}" fill="${farbe}" opacity="${f(op * (0.5 + r() * 0.5))}"/>`; } return s; }
function krater(r, farbe = "#5e564c") { let s = ""; for (let i = 0; i < 7; i++) s += `<circle cx="${f(14 + r() * 36)}" cy="${f(14 + r() * 36)}" r="${f(1.5 + r() * 4)}" fill="${farbe}" opacity="0.55"/>`; return s; }
function kontinente(r) { let s = ""; for (let i = 0; i < 4; i++) { const x = 14 + r() * 32, y = 14 + r() * 32; s += `<path d="M${f(x)} ${f(y)}q${f(4 + r() * 6)} ${f(-4 - r() * 3)} ${f(9 + r() * 5)} ${f(1 + r() * 3)}t${f(-2 - r() * 4)} ${f(6 + r() * 4)}t${f(-8 - r() * 3)} ${f(-2)}z" fill="#3fa968" opacity="0.85"/>`; } return s + `<ellipse cx="34" cy="22" rx="14" ry="3" fill="#fff" opacity="0.35"/>`; }
function adern(r, farbe) { let s = ""; for (let i = 0; i < 5; i++) { const x = 10 + r() * 40, y = 10 + r() * 40; s += `<path d="M${f(x)} ${f(y)}l${f(r() * 10 - 5)} ${f(4 + r() * 6)}l${f(r() * 10 - 2)} ${f(r() * 8)}" stroke="${farbe}" stroke-width="1.4" fill="none" opacity="0.9"/>`; } return s; }
Object.entries(PLANETEN).forEach(([id, p], i) => {
  const r = zufall(100 + i);
  schreibe(`planeten/${id}.svg`, svg(64, 64, `
<defs>
  <radialGradient id="k" cx="0.35" cy="0.32" r="0.75"><stop offset="0" stop-color="${p.a}"/><stop offset="0.55" stop-color="${p.b}"/><stop offset="1" stop-color="${p.c}"/></radialGradient>
  <radialGradient id="s" cx="0.72" cy="0.72" r="0.6"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient>
  <radialGradient id="h" cx="0.5" cy="0.5" r="0.5"><stop offset="0.82" stop-color="${p.a}" stop-opacity="0"/><stop offset="0.9" stop-color="${p.a}" stop-opacity="0.35"/><stop offset="1" stop-color="${p.a}" stop-opacity="0"/></radialGradient>
  <clipPath id="c"><circle cx="32" cy="32" r="24"/></clipPath>
</defs>
<circle cx="32" cy="32" r="30" fill="url(#h)"/>
<circle cx="32" cy="32" r="24" fill="url(#k)"/>
<g clip-path="url(#c)">${p.deko(r)}<circle cx="32" cy="32" r="24" fill="url(#s)"/></g>`));
});

// ---------- Sterne (Sonnen) für die Systemansicht ----------
const STERNE = { gelb: ["#fff7c2", "#ffd34d", "#ff9f1c"], rot: ["#ffc2a8", "#ff5a36", "#9b1d0b"], blau: ["#e6f4ff", "#7cc4ff", "#2b6fff"], weiss: ["#ffffff", "#e8f0ff", "#9fb4d8"], orange: ["#ffe0b8", "#ff9f43", "#c4501a"] };
Object.entries(STERNE).forEach(([id, [a, b, c]]) => schreibe(`sterne/${id}.svg`, svg(96, 96, `
<defs><radialGradient id="k" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${a}"/><stop offset="0.35" stop-color="${b}"/><stop offset="0.6" stop-color="${c}" stop-opacity="0.6"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
<circle cx="48" cy="48" r="46" fill="url(#k)"/><circle cx="48" cy="48" r="16" fill="${a}" opacity="0.9"/>`)));

// ---------- Rohstoff-Icons (32×32) ----------
const R = {
  metall: `<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f8"/><stop offset="1" stop-color="#6d7f92"/></linearGradient></defs>
<path d="M4 21l6-8h14l4 8z" fill="url(#a)" stroke="#2c3a48" stroke-width="1"/><path d="M4 21h24v4H4z" fill="#56677a" stroke="#2c3a48" stroke-width="1"/>
<path d="M9 12l4-5h10l2 5z" fill="url(#a)" stroke="#2c3a48" stroke-width="1"/><path d="M12 15h9" stroke="#fff" stroke-opacity="0.6"/>`,
  silizium: `<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9fff6"/><stop offset="1" stop-color="#1b8f86"/></linearGradient></defs>
<path d="M16 2l9 7v14l-9 7-9-7V9z" fill="url(#a)" stroke="#0b4a45" stroke-width="1"/><path d="M16 2v28M7 9l18 14M25 9L7 23" stroke="#e8fffb" stroke-opacity="0.45" stroke-width="0.8"/>`,
  rohoel: `<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b5a45"/><stop offset="1" stop-color="#140d06"/></linearGradient></defs>
<path d="M16 3c5 8 9 12 9 17a9 9 0 0 1-18 0c0-5 4-9 9-17z" fill="url(#a)" stroke="#d9a65a" stroke-width="1.2"/><ellipse cx="12.5" cy="19" rx="2" ry="3.5" fill="#fff" opacity="0.35"/>`,
  strom: `<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0"/><stop offset="1" stop-color="#ffb300"/></linearGradient></defs>
<path d="M19 2L6 18h8l-3 12 15-17h-8z" fill="url(#a)" stroke="#8a5a00" stroke-width="1" stroke-linejoin="round"/>`,
  antimaterie: `<defs><radialGradient id="a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff"/><stop offset="0.4" stop-color="#ff6fae"/><stop offset="1" stop-color="#ff6fae" stop-opacity="0"/></radialGradient></defs>
<circle cx="16" cy="16" r="15" fill="url(#a)" opacity="0.5"/><g fill="none" stroke="#ff9cc9" stroke-width="1.3"><ellipse cx="16" cy="16" rx="13" ry="5"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(-60 16 16)"/></g><circle cx="16" cy="16" r="3.2" fill="#fff"/>`
};
[["kunststoff_t1", "#b9e07a", "#4c7a1a", 1], ["kunststoff_t2", "#7ac8e0", "#1b5f7a", 2], ["kunststoff_t3", "#c58cf0", "#5a2a8a", 3]].forEach(([id, hell, dunkel, tier]) => {
  let punkte = ""; for (let i = 0; i < tier; i++) punkte += `<circle cx="${16 - (tier - 1) * 3.5 + i * 7}" cy="27" r="2.2" fill="#fff" stroke="${dunkel}" stroke-width="0.8"/>`;
  R[id] = `<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="${hell}"/><stop offset="1" stop-color="${dunkel}"/></linearGradient></defs>
<rect x="5" y="4" width="22" height="18" rx="6" fill="url(#a)" stroke="${dunkel}" stroke-width="1"/><path d="M10 9h12M10 13h8" stroke="#fff" stroke-opacity="0.55" stroke-width="1.4" stroke-linecap="round"/>${punkte}`;
});
Object.entries(R).forEach(([id, inhalt]) => schreibe(`rohstoffe/${id}.svg`, svg(32, 32, inhalt)));

// ---------- Logo & Favicon ----------
const EMBLEM = `<defs>
  <radialGradient id="pl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#bff7ff"/><stop offset="0.5" stop-color="#2aa7c9"/><stop offset="1" stop-color="#062a4a"/></radialGradient>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fe0ff" stop-opacity="0.2"/><stop offset="0.5" stop-color="#d8fbff"/><stop offset="1" stop-color="#5fe0ff" stop-opacity="0.2"/></linearGradient>
</defs>`;
const PLANET_RING = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="27" ry="8" fill="none" stroke="url(#ring)" stroke-width="2.5" transform="rotate(-20 ${cx} ${cy})"/>
<circle cx="${cx}" cy="${cy}" r="15" fill="url(#pl)"/>
<path d="M${cx - 26} ${cy + 9}a27 8 -20 0 0 52 -18" fill="none" stroke="url(#ring)" stroke-width="2.5" transform="rotate(0 ${cx} ${cy})" opacity="0.9"/>
<circle cx="${cx + 22}" cy="${cy - 16}" r="1.6" fill="#fff"/><circle cx="${cx - 20}" cy="${cy + 17}" r="1" fill="#bff7ff"/>`;
schreibe("logo.svg", svg(320, 64, `${EMBLEM}
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6fbff"/><stop offset="0.55" stop-color="#7fd8ff"/><stop offset="1" stop-color="#2a8fd0"/></linearGradient>
${PLANET_RING(32, 32)}
<text x="68" y="42" font-family="Trebuchet MS, Verdana, Segoe UI, Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="1.5" fill="url(#t)" stroke="#04243f" stroke-width="0.6">STERNENSPIEL</text>`));
schreibe("favicon.svg", svg(64, 64, `${EMBLEM}<rect width="64" height="64" rx="12" fill="#04102a"/>${PLANET_RING(32, 32)}`));
schreibe("emblem.svg", svg(64, 64, `${EMBLEM}${PLANET_RING(32, 32)}`));
console.log("fertig.");

// ---------- Gebäude (Kapitel 2) – 96×96, eigener Stil: Kachel mit Himmel, Boden und Bauwerk ----------
const GEB_RAHMEN = (himmel, boden, inhalt) => `
<defs>
  <linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${himmel[0]}"/><stop offset="1" stop-color="${himmel[1]}"/></linearGradient>
  <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${boden[0]}"/><stop offset="1" stop-color="${boden[1]}"/></linearGradient>
  <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9e6f2"/><stop offset="1" stop-color="#6b7f95"/></linearGradient>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fe0e0"/><stop offset="1" stop-color="#1a7fa8"/></linearGradient>
  <clipPath id="c"><rect x="2" y="2" width="92" height="92" rx="9"/></clipPath>
</defs>
<g clip-path="url(#c)">
  <rect width="96" height="96" fill="url(#h)"/>
  <circle cx="18" cy="16" r="0.9" fill="#fff" opacity="0.8"/><circle cx="74" cy="12" r="0.7" fill="#fff" opacity="0.7"/><circle cx="58" cy="24" r="0.6" fill="#cfe8ff" opacity="0.7"/><circle cx="86" cy="30" r="0.8" fill="#fff" opacity="0.6"/>
  <path d="M0 70 Q24 62 48 68 T96 66 V96 H0 Z" fill="url(#b)"/>
  ${inhalt}
</g>
<rect x="2" y="2" width="92" height="92" rx="9" fill="none" stroke="#2f6fa8" stroke-width="2"/>`;
const NACHT = ["#0a1c40", "#071026"], DAEMMERUNG = ["#1a2a5a", "#3a2a4a"];
const GEB = {
  metallmine: GEB_RAHMEN(NACHT, ["#5c6470", "#2a2f38"], `
    <path d="M14 70 L30 40 L46 70 Z" fill="#7d8796"/><path d="M30 40 L46 70 L38 70 Z" fill="#4f5866"/>
    <rect x="50" y="34" width="6" height="36" fill="url(#m)"/><path d="M44 34 H72 L66 40 H50 Z" fill="#9fb3c8"/>
    <rect x="62" y="40" width="3" height="30" fill="#6b7f95"/><circle cx="63.5" cy="36" r="6" fill="none" stroke="#c9d6e3" stroke-width="2.5"/>
    <rect x="58" y="58" width="22" height="12" rx="2" fill="#3b4a5e"/><rect x="61" y="61" width="6" height="4" fill="#ffd166"/>
    <path d="M18 76 h18 l-3 6 h-12z" fill="#9fb3c8"/><circle cx="22" cy="83" r="2" fill="#222"/><circle cx="32" cy="83" r="2" fill="#222"/>`),
  siliziummine: GEB_RAHMEN(NACHT, ["#3a5560", "#1c2a33"], `
    <path d="M18 70 L26 46 L34 70Z" fill="#7fd1c7"/><path d="M28 70 L38 38 L48 70Z" fill="#5fb8b0"/><path d="M38 38 L48 70 L43 70Z" fill="#3e8f8a"/>
    <path d="M22 60 L26 46 L30 60Z" fill="#c9fff7" opacity="0.6"/>
    <rect x="56" y="42" width="24" height="28" rx="2" fill="#2d4a5a"/><path d="M54 42 H82 L68 32Z" fill="#4a7a8c"/>
    <rect x="60" y="48" width="6" height="6" fill="#7fd1c7"/><rect x="70" y="48" width="6" height="6" fill="#7fd1c7"/><rect x="65" y="60" width="6" height="10" fill="#18303c"/>`),
  bohrstation: GEB_RAHMEN(DAEMMERUNG, ["#4a3a28", "#221a10"], `
    <path d="M30 70 L40 22 L50 70" fill="none" stroke="#c9a46a" stroke-width="3"/><path d="M33 56 H47 M35 44 H45 M37 32 H43" stroke="#c9a46a" stroke-width="2"/>
    <rect x="38" y="16" width="4" height="8" fill="#ff9f43"/>
    <path d="M56 66 L70 52 L84 58" fill="none" stroke="#8a6a3a" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="52" r="4" fill="#5a4024"/>
    <rect x="54" y="62" width="30" height="8" rx="2" fill="#3a2a18"/>
    <ellipse cx="22" cy="80" rx="12" ry="4" fill="#120c06"/><ellipse cx="22" cy="79" rx="8" ry="2" fill="#2b1d0e"/>`),
  solarfarm: GEB_RAHMEN(["#1e4a8a", "#0b2148"], ["#3c5a3a", "#1b2a1a"], `
    <circle cx="78" cy="18" r="9" fill="#ffd75e"/><circle cx="78" cy="18" r="13" fill="#ffd75e" opacity="0.25"/>
    <g transform="translate(10 52) skewX(-25)"><rect width="26" height="14" fill="#1a4aa0" stroke="#7cc4ff" stroke-width="1"/><path d="M8.6 0V14M17.3 0V14M0 7H26" stroke="#7cc4ff" stroke-width="0.8"/></g>
    <g transform="translate(44 52) skewX(-25)"><rect width="26" height="14" fill="#1a4aa0" stroke="#7cc4ff" stroke-width="1"/><path d="M8.6 0V14M17.3 0V14M0 7H26" stroke="#7cc4ff" stroke-width="0.8"/></g>
    <g transform="translate(26 72) skewX(-25)"><rect width="26" height="14" fill="#1a4aa0" stroke="#7cc4ff" stroke-width="1"/><path d="M8.6 0V14M17.3 0V14M0 7H26" stroke="#7cc4ff" stroke-width="0.8"/></g>
    <path d="M12 66v6M46 66v6M28 86v6" stroke="#6b7f95" stroke-width="2"/>`),
  oelverbrennung: GEB_RAHMEN(DAEMMERUNG, ["#3a3030", "#1a1414"], `
    <rect x="20" y="40" width="40" height="30" rx="3" fill="#4a4f5c"/><rect x="24" y="46" width="8" height="8" fill="#ff9f43"/><rect x="36" y="46" width="8" height="8" fill="#ff9f43"/><rect x="48" y="46" width="8" height="8" fill="#ffd166"/>
    <rect x="64" y="22" width="8" height="48" fill="#5c6270"/><rect x="64" y="26" width="8" height="3" fill="#c2410c"/><rect x="64" y="34" width="8" height="3" fill="#c2410c"/>
    <path d="M68 20 q-6 -8 2 -12 q-2 6 6 6 q-2 6 -8 6z" fill="#ff7a1a"/><circle cx="74" cy="8" r="5" fill="#555" opacity="0.5"/><circle cx="82" cy="4" r="6" fill="#555" opacity="0.35"/>
    <path d="M30 40 l6 -10 l6 10" fill="#ffd75e"/><path d="M34 36 l3 -5 l2 4 l3 -6" stroke="#fff3a0" stroke-width="1.5" fill="none"/>`),
  kunststoffwerk_t1: null, kunststoffwerk_t2: null, kunststoffwerk_t3: null,
  geologiestation: GEB_RAHMEN(NACHT, ["#4a3a28", "#221a10"], `
    <path d="M20 70 V48 a20 20 0 0 1 40 0 V70Z" fill="#3b4a5e"/><path d="M20 48 a20 20 0 0 1 40 0" fill="url(#g)" opacity="0.35"/>
    <rect x="34" y="56" width="12" height="14" fill="#18303c"/>
    <path d="M66 70 L74 40" stroke="#9fb3c8" stroke-width="3"/><circle cx="74" cy="38" r="5" fill="none" stroke="#3fe0e0" stroke-width="2"/>
    <path d="M10 84 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="#3fe0e0" stroke-width="1.5" fill="none" opacity="0.8"/>
    <ellipse cx="70" cy="86" rx="7" ry="2.5" fill="#120c06"/>`),
  raumflughafen: GEB_RAHMEN(NACHT, ["#3b4a5e", "#1a2230"], `
    <rect x="8" y="72" width="80" height="12" fill="#2a3444"/><path d="M14 78 H82" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="5 4"/>
    <rect x="58" y="40" width="22" height="32" rx="2" fill="#4a5a70"/><rect x="62" y="44" width="14" height="6" fill="#3fe0e0"/><path d="M64 40 V30 h10 V40" fill="#6b7f95"/>
    <path d="M30 70 V36 l6 -14 l6 14 V70Z" fill="url(#m)"/><path d="M30 60 l-6 10 h6Z M42 60 l6 10 h-6Z" fill="#c2410c"/><circle cx="36" cy="44" r="3" fill="#3fe0e0"/>`),
  werft: GEB_RAHMEN(NACHT, ["#3b4a5e", "#1a2230"], `
    <path d="M10 70 V30 H86 V70" fill="none" stroke="#6b7f95" stroke-width="3"/><path d="M10 30 L22 20 H74 L86 30" fill="none" stroke="#9fb3c8" stroke-width="2"/>
    <rect x="44" y="30" width="2" height="12" fill="#9fb3c8"/><rect x="40" y="42" width="10" height="4" fill="#ffd166"/>
    <path d="M22 60 L60 54 L76 60 L60 66Z" fill="url(#m)"/><path d="M60 54 L76 60 L60 66Z" fill="#6b7f95"/><circle cx="70" cy="60" r="2" fill="#3fe0e0"/>`),
  verteidigungswerft: GEB_RAHMEN(NACHT, ["#3a3a4a", "#1a1a26"], `
    <path d="M48 18 L74 28 V48 C74 62 62 70 48 76 C34 70 22 62 22 48 V28Z" fill="#2d4a7a" stroke="#7cc4ff" stroke-width="2"/>
    <path d="M48 28 L64 34 V48 C64 56 57 62 48 66 C39 62 32 56 32 48 V34Z" fill="#1a3060"/>
    <rect x="44" y="38" width="8" height="18" fill="#9fb3c8"/><rect x="38" y="44" width="20" height="6" fill="#9fb3c8"/>`),
  forschungseinrichtung: GEB_RAHMEN(NACHT, ["#2f3a4f", "#151b28"], `
    <rect x="18" y="46" width="40" height="24" rx="2" fill="#3b4a5e"/><path d="M18 46 a20 14 0 0 1 40 0" fill="#4a6a8c"/><rect x="34" y="34" width="8" height="6" fill="#18303c"/>
    <rect x="24" y="54" width="6" height="6" fill="#3fe0e0"/><rect x="34" y="54" width="6" height="6" fill="#3fe0e0"/><rect x="44" y="54" width="6" height="6" fill="#3fe0e0"/>
    <path d="M68 70 V54 l-6 -12 h16 l-6 12 V70" fill="none" stroke="#c9d6e3" stroke-width="2"/><path d="M63 64 h14 v6 h-14z" fill="#b9e07a" opacity="0.8"/>
    <circle cx="72" cy="34" r="2" fill="#b9e07a"/><circle cx="76" cy="26" r="1.5" fill="#b9e07a" opacity="0.7"/>`),
  solarsatellit: GEB_RAHMEN(["#081530", "#030a1a"], ["#0b2a4a", "#061428"], `
    <circle cx="74" cy="78" r="30" fill="#1f6fbf" opacity="0.6"/>
    <g transform="rotate(-20 48 40)"><rect x="12" y="34" width="26" height="12" fill="#1a4aa0" stroke="#7cc4ff"/><rect x="58" y="34" width="26" height="12" fill="#1a4aa0" stroke="#7cc4ff"/>
    <path d="M38 40 H58" stroke="#9fb3c8" stroke-width="2"/><rect x="42" y="32" width="12" height="16" rx="2" fill="url(#m)"/><circle cx="48" cy="40" r="2.5" fill="#3fe0e0"/>
    <path d="M20.6 34V46M29.3 34V46M66.6 34V46M75.3 34V46" stroke="#7cc4ff" stroke-width="0.8"/></g>`)
};
const WERK = (farbe, zahl, extra) => GEB_RAHMEN(NACHT, ["#3a3f4a", "#1a1d24"], `
    <rect x="12" y="44" width="50" height="26" fill="#3b4a5e"/><path d="M12 44 l10 -8 v8 l10 -8 v8 l10 -8 v8 l10 -8 v8 l10 -8 v8" fill="#4f6178"/>
    <rect x="66" y="26" width="14" height="44" rx="5" fill="${farbe}" opacity="0.9"/><rect x="66" y="26" width="14" height="6" rx="3" fill="#fff" opacity="0.3"/>
    <rect x="18" y="52" width="8" height="8" fill="${farbe}"/><rect x="30" y="52" width="8" height="8" fill="${farbe}"/><rect x="42" y="52" width="8" height="8" fill="${farbe}"/>
    <rect x="52" y="20" width="5" height="24" fill="#5c6270"/><circle cx="56" cy="14" r="4" fill="#888" opacity="0.4"/>
    <text x="73" y="56" font-family="Verdana,Arial,sans-serif" font-size="12" font-weight="700" fill="#04102a" text-anchor="middle">T${zahl}</text>${extra || ""}`);
GEB.kunststoffwerk_t1 = WERK("#b9e07a", 1);
GEB.kunststoffwerk_t2 = WERK("#7ac8e0", 2);
GEB.kunststoffwerk_t3 = WERK("#c58cf0", 3, `<circle cx="86" cy="20" r="2" fill="#c58cf0"/>`);
Object.entries(GEB).forEach(([id, inhalt]) => schreibe(`gebaeude/${id}.svg`, svg(96, 96, inhalt)));
