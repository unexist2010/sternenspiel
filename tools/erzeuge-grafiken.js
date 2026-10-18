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
