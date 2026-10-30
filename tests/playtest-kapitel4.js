// Browser-Playtest Kapitel 4 (0.10.0, Schiffsliste nach Sandro): Werft – ohne Werft, 24 Schiffe, Bau mit Menge, Warteschlange, Übersicht, Info, Offline, Master.
// Aufruf:  node tests/playtest-kapitel4.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel4.js
//          PLAYTEST_BROWSER=firefox node tests/playtest-kapitel4.js
// Desktop 1366×768 und Handy 412×915. Screenshots: playtest/kapitel4b-*.png
"use strict";
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

function ladePlaywright() {
  const kandidaten = [process.env.PLAYWRIGHT_CORE, "playwright-core", "playwright"].filter(Boolean);
  const pnpm = "/usr/local/lib/pnpm/5/.pnpm"; // Fallback auf der Box
  if (fs.existsSync(pnpm)) for (const d of fs.readdirSync(pnpm).filter((d) => d.startsWith("playwright-core@")).sort().reverse()) kandidaten.push(path.join(pnpm, d, "node_modules/playwright-core"));
  for (const k of kandidaten) { try { return require(k); } catch (e) { /* nächster */ } }
  throw new Error("playwright-core nicht gefunden (npm i playwright-core oder PLAYWRIGHT_CORE setzen)");
}
const PW = ladePlaywright();
const { chromium } = PW;
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/opt/google/chrome/chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const LIVE = process.env.LIVE_URL || "";
const URL_ = LIVE || pathToFileURL(path.join(__dirname, "..", "index.html")).href;
const BASIS = URL_.replace(/[^/]*$/, "");
const OUT = path.join(__dirname, "..", "playtest");
fs.mkdirSync(OUT, { recursive: true });
const VERSION = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").match(/data-version="([^"]+)"/)[1]; // immer die aktuelle Version
const TAG = 24 * 3600000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fehlschlaege = 0, pruefungen = 0;
function ok(bed, text) { pruefungen++; console.log((bed ? "OK   " : "FAIL ") + text); if (!bed) fehlschlaege++; }
const GERAETE = [
  { name: "desktop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: "handy", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const BROWSERNAME = process.env.PLAYTEST_BROWSER || "chromium";

async function lauf(browser, g) {
  console.log(`\n== ${BROWSERNAME} ${g.name} ${g.viewport.width}×${g.viewport.height} ==`);
  const handy = g.name === "handy";
  const opt = { viewport: g.viewport, hasTouch: g.hasTouch, deviceScaleFactor: g.deviceScaleFactor, locale: "de-DE", timezoneId: "Europe/Vienna" };
  if (BROWSERNAME === "chromium") opt.isMobile = g.isMobile;
  const ctx = await browser.newContext(opt);
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") fehler.push("console." + m.type() + ": " + m.text()); });
  page.on("requestfailed", (r) => fehler.push("requestfailed: " + r.url()));
  page.on("request", (r) => { if (!r.url().startsWith(BASIS) && !r.url().startsWith("data:")) fehler.push("externe Anfrage: " + r.url()); });
  const praefix = `kapitel4b-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
  const shot = async (n, ganz) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; }); if (ganz) await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !!ganz }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  const stufe = (id) => Z((i) => window.SS.app.zustand.planeten[0].gebaeude[i], id);
  const klickBauen = async (id) => { await page.click(`article.anlage[data-gebaeude="${id}"] button[data-aktion="bauen"]`); await sleep(150); };
  // Info-Fenster vollständig im sichtbaren Bereich?
  const infoImBild = () => page.evaluate(() => {
    const f = document.getElementById("infofenster"); if (f.hidden) return { sichtbar: false };
    const r = f.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    return { sichtbar: true, imBild: r.left >= 0 && r.top >= 0 && r.right <= vw + 0.5 && r.bottom <= vh + 0.5, zeilen: f.querySelectorAll("tbody tr").length, text: f.textContent, r: [r.left, r.top, r.right, r.bottom].map(Math.round), vw, vh };
  });
  const oeffneInfo = async (sel) => {
    if (!handy) { await page.mouse.move(683, 2); await sleep(400); }
    const k = page.locator(sel).first();
    await k.evaluate((e) => e.scrollIntoView({ block: "center" })); await sleep(250); // Scroll-Ereignis abwarten (schließt ein Hover-Fenster)
    if (handy) await k.tap(); else { const b = await k.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 }); }
    await page.waitForSelector("#infofenster:not([hidden])", { timeout: 3000 }).catch(() => {});
    await sleep(150);
    if (!handy && await page.isHidden("#infofenster")) { // ein spätes Scroll-Ereignis (nach Ganzseiten-Screenshot) schließt Hover-Fenster → erneut zeigen
      await page.mouse.move(5, 5); await sleep(300); await k.hover(); await sleep(200);
    }
    return infoImBild();
  };
  const schliesseInfo = async () => {
    if (handy) { await page.tap("#infofenster .info-zu"); }
    else { await page.mouse.move(5, g.viewport.height - 5); }
    await sleep(350);
  };
  const kachelIds = () => page.$$eval("article.schiff-kachel", (k) => k.map((x) => x.getAttribute("data-schiff")));
  const aendern = async (fn, arg) => { await Z(fn, arg); await Z(() => { window.SS.app.speichern(); window.SS.app.route(true); }); await sleep(200); };
  const grund = (id) => page.textContent(`article[data-schiff="${id}"] .grund`).then((t) => t.trim()).catch(() => "");
  const anzahl = (id) => Z((i) => i === "solarsatellit" ? window.SS.app.zustand.planeten[0].solarsatelliten : (window.SS.app.zustand.planeten[0].schiffe[i] || 0), id);
  const q = () => Z(() => window.SS.app.zustand.planeten[0].werftauftraege.length);

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION}`);
  ok(/Kapitel 4 · Werft/.test(await page.textContent(".fusszeile")), "Fußzeile: Kapitel 4 · Werft");
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  ok(await Z(() => { const z = window.SS.app.zustand; return z.version === 8 && Array.isArray(z.planeten[0].werftauftraege) && JSON.stringify(z.planeten[0].schiffe) === "{}"; }), "Spielstand v8: leerer Schiffsbestand, leere Werft-Warteschlange");
  ok(/Werft bauen/.test(await page.textContent("#werft-box")), "Übersicht: Werft-Kasten mit Link „Werft bauen“");

  // ---- ohne Werft ----
  await geheZu("#werft", "werft");
  ok(await page.isVisible("#werft-hinweis") && await page.isVisible("#knopf-werft-bauen"), "Werft-Seite ohne Werft: Hinweis + Link „Werft bauen“");
  ok((await kachelIds()).length === 0, "Ohne Werft keine Schiffskacheln");
  await page.click("#knopf-werft-bauen");
  await page.waitForSelector('#inhalt[data-seite="anlagen"]');
  ok(true, "Link führt zu Anlagen");

  // ---- Werft 1 + Rohstoffe ----
  await aendern(() => { const z = window.SS.app.zustand; z.planeten[0].gebaeude.werft = 1; z.forschung.energie = 1; Object.assign(z.rohstoffe, { metall: 5e6, silizium: 5e6, rohoel: 5e6 }); });
  await geheZu("#werft", "werft");
  let ids = await kachelIds();
  ok(ids.length === 24 && ids.includes("bodensammler") && ids.includes("orbitalverteidigungsplattform") && !ids.includes("antimaterie_frachter"), `24 Schiffe sichtbar inkl. Bodensammler + Orbitalverteidigungsplattform (${ids.length})`);
  ok(/Orbitalverteidigungsplattform/.test(await page.textContent('article[data-schiff="orbitalverteidigungsplattform"]')) && /stationär/.test(await page.textContent('article[data-schiff="orbitalverteidigungsplattform"]')), "Orbitalverteidigungsplattform: umbenannt, stationär");
  ok((await page.$$eval("section[data-gruppe]", (s) => s.map((x) => x.getAttribute("data-gruppe")))).join() === "kampf,hilf,spezial", "Gruppen Kampfschiffe, Hilfsschiffe, Spezial");
  ok((await page.$$eval("article.schiff-kachel img.anlage-bild", (im) => im.filter((i) => i.complete && i.naturalWidth > 0).length)) === 24, "Platzhalter-SVGs der 24 Schiffe geladen");
  ok(/Voraussetzung fehlt: Verbrennungstriebwerk 1, Computer-Technologie 1/.test(await grund("kleine_drohne")) && !(await page.isEnabled('article[data-schiff="kleine_drohne"] button[data-aktion="schiff-bauen"]')), "Kleine Drohne gesperrt mit Grund (Verbrennung 1, Computer 1)");
  ok(/Verbund/.test(await page.textContent('article[data-schiff="bomber"] .schiff-marken')) && /Plasma/.test(await page.textContent('article[data-schiff="bomber"] .schiff-marken')), "Kachel zeigt Hülle + Waffen (Bomber: Verbund, Plasma)");
  ok(await page.isEnabled('article[data-schiff="solarsatellit"] button[data-aktion="schiff-bauen"]'), "Solarsatellit baubar mit Werft 1 + Energie 1");
  ok(/24 Min\. 0 Sek\./.test(await page.textContent('article[data-schiff="solarsatellit"] .anlage-werte')), "Bauzeit je Stück: Solarsatellit 2.000/(2.500·2) Std. = 24 Min.");

  // ---- Bauen mit Menge ----
  const stromVor = await Z(() => window.SS.kern.produktion.uebersicht(window.SS.app.zustand).strom.erzeugung);
  await page.fill('input[data-menge="solarsatellit"]', "3");
  await page.click('article[data-schiff="solarsatellit"] button[data-aktion="schiff-bauen"]'); await sleep(250);
  ok((await q()) === 1 && await Z(() => window.SS.app.zustand.planeten[0].werftauftraege[0].menge === 3), "Auftrag 3× Solarsatellit gestartet");
  await aendern(() => { window.SS.app.zustand.forschung.verbrennung = 2; window.SS.app.zustand.forschung.computer = 1; });
  await page.fill('input[data-menge="kleine_drohne"]', "5");
  await page.click('article[data-schiff="kleine_drohne"] button[data-aktion="schiff-bauen"]'); await sleep(250);
  ok((await q()) === 2, "Zweiter Auftrag (5× Kleine Drohne) in der Warteschlange");
  for (let i = 0; i < 5; i++) { await page.fill('input[data-menge="solarsatellit"]', "1"); await page.click('article[data-schiff="solarsatellit"] button[data-aktion="schiff-bauen"]'); await sleep(120); }
  ok((await q()) === 7, "Warteschlange unbegrenzt: 7 Aufträge angenommen");
  await Z(() => { const q = window.SS.app.zustand.planeten[0].werftauftraege; q.splice(2); });
  ok(await page.isVisible('#werft-box [data-live="werft-rest:0"]') && /wartet/.test(await page.textContent('#werft-box [data-live="werft-rest:1"]')), "Warteschlange: Restzeit, zweiter Auftrag wartet");
  await geheZu("#anlagen", "anlagen");
  ok(/Werft Schiffe baut/.test(await page.textContent('article[data-gebaeude="werft"] .grund')), "Anlagen: Werft-Ausbau während Schiffbau gesperrt");
  await geheZu("#uebersicht", "uebersicht");
  ok(/3× Solarsatellit/.test(await page.textContent("#werft-box")) && /5× Kleine Drohne/.test(await page.textContent("#werft-box")), "Übersicht zeigt die Werft-Aufträge");
  await shot(handy ? "handy-uebersicht-werft" : "desktop-uebersicht-werft");

  // ---- Fertig (Zeit vorspulen) ----
  await Z(() => { const q = window.SS.app.zustand.planeten[0].werftauftraege, a = q[0], d = a.ende - a.start; a.start = Date.now() - d - 2000; a.ende = Date.now() - 2000; const b = q[1]; const db = b.ende - b.start; b.start = a.ende; b.ende = a.ende + db; });
  await sleep(1500);
  ok((await anzahl("solarsatellit")) === 3, "3 Solarsatelliten fertig");
  const stromNach = await Z(() => window.SS.kern.produktion.uebersicht(window.SS.app.zustand).strom.erzeugung);
  ok(stromNach > stromVor, `Satelliten liefern Strom (${Math.round(stromVor)} → ${Math.round(stromNach)})`);
  await geheZu("#werft", "werft");
  ok(/^3$/.test((await page.textContent('[data-schiff-anzahl="solarsatellit"]')).trim()), "Kachel: Anzahl 3");
  ok(await ueberlauf() <= 0, "Werft: kein waagrechter Überlauf");
  await shot(handy ? "handy-werft" : "desktop-werft", !handy);

  // ---- Info ----
  let inf = await oeffneInfo('article[data-schiff="kleine_drohne"] .info-knopf');
  ok(inf.sichtbar && inf.imBild, `Info Kleine Drohne ${handy ? "per Antippen" : "per Hover"} sichtbar und im Bild ${JSON.stringify(inf.r)}`);
  ok(/Schnellfeuer gegen/.test(inf.text) && /Angriff/.test(inf.text) && /Leichtmetall/.test(inf.text) && /Laser/.test(inf.text), "Info: Werte, Hülle, Waffen, Schnellfeuer");
  if (!handy) await shot("desktop-infofenster");
  await schliesseInfo();

  // ---- Abbrechen ----
  const m0 = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await page.click('#werft-box [data-aktion="werft-abbrechen"][data-index="0"]'); await sleep(150);
  await page.click("#dialog-ok"); await sleep(250);
  ok((await q()) === 0 && (await Z(() => window.SS.app.zustand.rohstoffe.metall)) > m0, "Abbrechen erstattet die offenen Einheiten");

  // ---- Offline ----
  await page.fill('input[data-menge="kleiner_frachter"]', "2").catch(() => {});
  await aendern(() => { const z = window.SS.app.zustand; z.forschung.verbrennung = 2; z.planeten[0].gebaeude.werft = 2; });
  await page.fill('input[data-menge="kleiner_frachter"]', "2");
  await page.click('article[data-schiff="kleiner_frachter"] button[data-aktion="schiff-bauen"]'); await sleep(250);
  const pid = await Z(() => window.SS.app.aktivId);
  await page.click(handy ? "#knopf-menue-auf" : "#knopf-spieler-wechseln").catch(() => {});
  if (handy) { await sleep(300); await page.click("#knopf-spieler-wechseln"); }
  await page.waitForSelector("#bildschirm-start.aktiv");
  await Z((id) => {
    const k = window.SS.kern.profile.spielstandSchluessel(id), z = JSON.parse(localStorage.getItem(k)), a = z.planeten[0].werftauftraege[0];
    const d = a.ende - a.start; a.ende = Date.now() - 60000; a.start = a.ende - d; z.zeit.letzterTick = Date.now() - 2 * 3600000; localStorage.setItem(k, JSON.stringify(z));
  }, pid);
  await page.reload();
  await page.click(`#profil-liste .profil:has(b:text-is("Sandro")) [data-aktion="spielen"]`);
  await page.waitForSelector('#bildschirm-spiel.aktiv');
  ok(await page.isVisible("#dialog") && /2× Kleiner Frachter gebaut/.test(await page.textContent("#dialog")), "Offline: Schiffe beim Neuladen fertig („gebaut“ im Willkommen-Dialog)");
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  ok((await anzahl("kleiner_frachter")) === 2, "2 Kleine Frachter nach Offline-Zeit");

  // ---- Master ----
  await page.click("#knopf-master"); await sleep(200);
  await geheZu("#werft", "werft");
  ok((await kachelIds()).length === 24, "Master: alle 24 Schiffe sichtbar");
  const mm = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await page.fill('input[data-menge="titan"]', "2");
  await page.click('article[data-schiff="titan"] button[data-aktion="schiff-bauen"]'); await sleep(300);
  ok((await anzahl("titan")) === 2 && Math.abs((await Z(() => window.SS.app.zustand.rohstoffe.metall)) - mm) < 1000, "Master: 2 Titanen sofort und kostenlos trotz fehlender Voraussetzungen");
  if (!handy) await shot("master-werft", true);
  await page.click("#knopf-master"); await sleep(200);
  ok(await ueberlauf() <= 0, "Kein waagrechter Überlauf");
  ok(fehler.length === 0, "Keine Konsolen-/Seitenfehler, keine externen Anfragen" + (fehler.length ? ":\n  " + fehler.join("\n  ") : ""));
  await ctx.close();
}
(async () => {
  console.log("Browser:", BROWSERNAME, "\nURL:", URL_);
  const browser = BROWSERNAME === "firefox" ? await PW.firefox.launch({ headless: true })
    : await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try { for (const g of GERAETE) await lauf(browser, g); }
  finally { await browser.close(); }
  console.log(`\n${pruefungen - fehlschlaege}/${pruefungen} Prüfungen grün` + (fehlschlaege ? ` – ${fehlschlaege} FEHLGESCHLAGEN` : " – ALLE GRÜN"));
  process.exit(fehlschlaege ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
