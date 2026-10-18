// Browser-Playtest Nachbesserung Kapitel 2 (0.7.0): Master-Modus, Info-Fenster, Geologie & Rohölvorkommen, Startplätze A–Z.
// Aufruf:  node tests/playtest-kapitel2b.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel2b.js
//          PLAYTEST_BROWSER=firefox node tests/playtest-kapitel2b.js
// Desktop 1366×768 und Handy 412×915. Screenshots: playtest/kapitel2b-*.png
// Offline-Fertigstellung nach Neuladen, kein Überlauf, keine Konsolenfehler. Screenshots: playtest/kapitel2-*.png
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
const VERSION = "0.7.0";
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
  const praefix = `kapitel2b-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
  const shot = async (n, ganz) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; }); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !!ganz }); };
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
    const k = page.locator(sel).first();
    await k.scrollIntoViewIfNeeded();
    if (handy) await k.tap(); else await k.hover();
    await page.waitForSelector("#infofenster:not([hidden])", { timeout: 3000 }).catch(() => {});
    await sleep(150);
    return infoImBild();
  };
  const schliesseInfo = async () => {
    if (handy) { await page.tap("#infofenster .info-zu"); }
    else { await page.mouse.move(5, g.viewport.height - 5); }
    await sleep(350);
  };

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION}`);
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');

  // ---- Master-Knopf erreichbar ----
  const mk = await page.evaluate(() => { const r = document.getElementById("knopf-master").getBoundingClientRect(); return { r: [r.left, r.top, r.right, r.bottom], vw: innerWidth, aria: document.getElementById("knopf-master").getAttribute("aria-pressed") }; });
  ok(mk.r[0] >= 0 && mk.r[2] <= mk.vw && mk.r[1] >= 0 && mk.r[3] < 140 && mk.aria === "false", "MASTER-Knopf im Kopfbereich sichtbar, anfangs aus");
  ok(await page.isHidden("#master-hinweis"), "Kein Master-Hinweis, solange aus");

  // ---- Übersicht: Rohölvorkommen + Punkte ----
  let t = (await page.textContent("#inhalt")).replace(/\s+/g, " ");
  ok(/Rohölvorkommen/.test(t) && /1\.000\.000/.test(await page.textContent("#uebersicht-vorkommen")), "Übersicht: Rohölvorkommen 1.000.000");
  ok(/Förderung/.test(t) && /Nächster Fund in/.test(t) && /Geologiestation bauen/.test(t), "Übersicht: Förderung/h und nächster Fund (ohne Station: Hinweis)");
  ok(await page.isVisible("#uebersicht-punkte"), "Übersicht: Punkte groß angezeigt");

  // ---- Anlagen: T2/T3 gesperrt, Info-Fenster ----
  await geheZu("#anlagen", "anlagen");
  for (const id of ["kunststoffwerk_t2", "kunststoffwerk_t3"]) {
    const grund = (await page.textContent(`article[data-gebaeude="${id}"] .grund`)).trim();
    ok(!(await page.isEnabled(`article[data-gebaeude="${id}"] button[data-aktion="bauen"]`)) && grund === "Wird später mit Spielfortschritt freigeschaltet.", `${id} gesperrt („${grund}“)`);
  }
  ok((await page.$$eval("article.anlage .info-knopf", (k) => k.length)) === 13, "13 Info-Knöpfe (ⓘ) an den Gebäuden");
  let inf = await oeffneInfo('article[data-gebaeude="metallmine"] .info-knopf');
  ok(inf.sichtbar && inf.imBild, `Info Metallmine ${handy ? "per Antippen" : "per Hover"} sichtbar und im Bild ${JSON.stringify(inf.r)}`);
  ok(inf.zeilen === 6 && /Diff\./.test(inf.text) && /Kosten/.test(inf.text) && /Bauzeit/.test(inf.text) && /Strombedarf/.test(inf.text), `Info-Tabelle: aktuelle + 5 Stufen, Diff., Strom, Kosten, Bauzeit (${inf.zeilen} Zeilen)`);
  ok(/\+\d/.test(inf.text) && /ausführlich|Baustoff/.test(inf.text), "Info: ausführliche Beschreibung und Differenz +X/h");
  await shot(handy ? "handy-infofenster" : "desktop-anlagen-infofenster");
  await schliesseInfo();
  ok((await infoImBild()).sichtbar === false, handy ? "Info schließt mit ×" : "Info schließt beim Wegbewegen der Maus");
  // Randfälle: rechte Spalte, letzte Kachel, Geologie (Fundgrößen)
  for (const id of ["bohrstation", "oelverbrennung", "forschungseinrichtung", "geologiestation"]) {
    inf = await oeffneInfo(`article[data-gebaeude="${id}"] .info-knopf`);
    ok(inf.sichtbar && inf.imBild, `Info ${id} im Bild ${JSON.stringify(inf.r)}`);
    if (id === "geologiestation") ok(/50\.000–100\.000/.test(inf.text) && /80\.000–125\.000/.test(inf.text), "Info Geologie: Fundgrößen je Stufe");
    if (id === "oelverbrennung") ok(/Rohöl\/h/.test(inf.text) && /Strom/.test(inf.text), "Info Ölverbrennung: Strom + Rohölverbrauch");
    await schliesseInfo();
  }
  if (!handy) { // Klick heftet an, × schließt
    await page.click('article[data-gebaeude="solarfarm"] .info-knopf');
    await sleep(150);
    ok(await page.isVisible("#infofenster .info-zu"), "Desktop: Klick heftet Info-Fenster an (mit ×)");
    await page.click("#infofenster .info-zu"); await sleep(150);
    ok(await page.isHidden("#infofenster"), "Desktop: × schließt");
  }
  ok(await ueberlauf() <= 0, "Anlagen: kein Überlauf");

  // ---- Master an ----
  if (handy) await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#knopf-master");
  await sleep(200);
  ok((await page.getAttribute("#knopf-master", "aria-pressed")) === "true" && (await page.isVisible("#master-hinweis")) && /MASTER aktiv/.test(await page.textContent("#master-hinweis")), "Master an: Knopf markiert, Hinweis „MASTER aktiv“");
  ok(await Z(() => window.SS.app.zustand.einstellungen.master === true), "Master im Profil gespeichert (einstellungen.master)");
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(handy ? "handy-master-aktiv" : "master-aktiv");
  const vor = await Z(() => ({ r: Object.assign({}, window.SS.app.zustand.rohstoffe), p: window.SS.app.zustand.punkte }));
  ok(await page.isEnabled('article[data-gebaeude="oelverbrennung"] button[data-aktion="bauen"]'), "Master: Ölverbrennung baubar trotz fehlender Rohstoffe");
  await klickBauen("oelverbrennung");
  const nach = await Z(() => ({ r: window.SS.app.zustand.rohstoffe, p: window.SS.app.zustand.punkte, b: window.SS.app.zustand.planeten[0].bauauftrag }));
  ok((await stufe("oelverbrennung")) === 1 && nach.b === null, "Master: Ölverbrennung sofort Stufe 1 (keine Bauzeit)");
  ok(nach.r.metall >= vor.r.metall - 0.01 && nach.r.silizium >= vor.r.silizium - 0.01 && nach.r.rohoel >= vor.r.rohoel - 5, "Master: keine Rohstoffe abgezogen");
  ok(nach.p > vor.p, `Master: Punkte trotzdem gutgeschrieben (${vor.p.toFixed(2)} → ${nach.p.toFixed(2)})`);
  await klickBauen("kunststoffwerk_t3");
  ok((await stufe("kunststoffwerk_t3")) === 1, "Master: Kunststoffwerk T3 trotz Sperre gebaut");
  for (let i = 0; i < 3; i++) await klickBauen("metallmine");
  ok((await stufe("metallmine")) === 3, "Master: Metallmine 3× hintereinander sofort");

  // ---- Geologie ----
  await klickBauen("geologiestation");
  ok((await stufe("geologiestation")) === 1, "Geologiestation gebaut");
  const cd = (await page.textContent('article[data-gebaeude="geologiestation"] [data-live="geo-countdown"]')).trim();
  ok(/23 Std\. 5\d Min\.|1 Tg|24 Std/.test(cd), `Countdown bis zum nächsten Fund (${cd})`);
  const v0 = await Z(() => window.SS.app.zustand.planeten[0].rohoelVorkommen);
  await page.click('article[data-gebaeude="geologiestation"] button[data-aktion="fund-test"]');
  await sleep(250);
  const v1 = await Z(() => window.SS.app.zustand.planeten[0].rohoelVorkommen);
  ok(v1 - v0 >= 50000 && v1 - v0 <= 100000, `„Fund sofort auslösen“: +${v1 - v0} Rohöl (Stufe 1)`);
  // Offline/nachgeholt: Takt 2 Tage zurück → 2 Funde
  await Z((tag) => { window.SS.app.zustand.planeten[0].geologie.naechsterFund = Date.now() - 2 * tag + 3000; }, TAG);
  await page.waitForFunction(() => window.SS.app.zustand.planeten[0].geologie.funde.length >= 3, null, { timeout: 5000 }).catch(() => {});
  await sleep(300);
  ok((await Z(() => window.SS.app.zustand.planeten[0].geologie.funde.length)) === 3, "Verpasste 24-h-Funde werden nachgeholt (2 + 1 Test)");
  await page.click("#fund-log summary");
  await sleep(150);
  const logZeilen = await page.$$eval("#fund-log tbody tr", (r) => r.map((x) => x.textContent));
  ok(logZeilen.length === 3 && /\+\d{2}\.\d{3}/.test(logZeilen[0]) && /Test/.test(logZeilen[0]), `Fund-Log: 3 Einträge mit Datum/Stufe/Menge (neuester oben: ${logZeilen[0] && logZeilen[0].replace(/\s+/g, " ")})`);
  await page.locator('article[data-gebaeude="geologiestation"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('article[data-gebaeude="geologiestation"]').scrollIntoView({ block: "center" }));
  await shot(handy ? "handy-geologie-log" : "geologie-log");
  ok(await ueberlauf() <= 0, "Anlagen (Master/Geologie): kein Überlauf");

  // ---- Raumflughafen A–Z ----
  await klickBauen("raumflughafen");
  await geheZu("#anlagen/raumflughafen", "anlagen");
  ok((await page.$$eval(".startplatz-karte", (k) => k.map((x) => x.getAttribute("data-buchstabe")).join(""))) === "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "26 Startplätze A–Z");
  for (let i = 0; i < 10; i++) { await page.click('.startplatz-karte[data-buchstabe="A"] button[data-aktion="bauen"]'); await sleep(120); }
  ok((await Z(() => window.SS.app.zustand.planeten[0].startplaetze[0].stufe)) === 10, "Master: Startplatz A sofort auf Stufe 10");
  ok((await page.textContent("#gesamtkapazitaet")).trim() === "100", "Gesamtkapazität A10 = 100 Schiffe");
  inf = await oeffneInfo('.startplatz-karte[data-buchstabe="B"] .info-knopf');
  ok(inf.sichtbar && inf.imBild && /Kapazität B/.test(inf.text) && /Gesamt/.test(inf.text), "Info Startplatz B: Kapazität je Stufe, im Bild");
  await schliesseInfo();
  // Master aus → Sperren wieder sichtbar
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#knopf-master-aus");
  await sleep(250);
  ok(await page.isHidden("#master-hinweis"), "Master aus: Hinweis verschwindet");
  const punkte = await Z(() => window.SS.app.zustand.punkte);
  const bText = (await page.textContent('.startplatz-karte[data-buchstabe="B"]')).replace(/\s+/g, " ");
  if (punkte < 75) ok(/75 Punkte nötig/.test(bText) && !/A Stufe 10/.test(bText), `B: nur noch „75 Punkte nötig“ (A10 erreicht, ${Math.floor(punkte)} Punkte)`);
  else ok(!/nötig/.test(bText), "B frei (A10 + Punkte erreicht)");
  ok(/B Stufe 10 nötig/.test(await page.textContent('.startplatz-karte[data-buchstabe="C"]')), "C: „B Stufe 10 nötig“");
  ok(await ueberlauf() <= 0, "Raumflughafen: kein Überlauf");
  await shot(handy ? "handy-raumflughafen" : "raumflughafen", true);

  // ---- Übersicht mit Vorkommen + Funde ----
  await geheZu("#uebersicht", "uebersicht");
  const vk = (await page.textContent("#uebersicht-vorkommen")).trim();
  ok(/^1\.[1-3]\d{2}\.\d{3}$/.test(vk), `Übersicht: Vorkommen inkl. Funde (${vk})`);
  ok(!/Geologiestation bauen/.test(await page.textContent("#rohoel-box")), "Übersicht: Countdown statt Hinweis");
  if (!handy) await shot("desktop-uebersicht");

  // ---- Master je Profil ----
  if (!handy) {
    await page.click("#knopf-master"); await sleep(150);
    await page.click("#knopf-spieler-wechseln");
    await page.fill("#eingabe-name", "Zweiter");
    await page.click("#knopf-neues-spiel");
    await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
    ok((await page.getAttribute("#knopf-master", "aria-pressed")) === "false" && await page.isHidden("#master-hinweis"), "Zweites Profil: Master aus");
    await page.click("#knopf-spieler-wechseln");
    await page.reload();
    await page.click(`#profil-liste .profil:has(b:text-is("Sandro")) [data-aktion="spielen"]`);
    await page.waitForSelector('#bildschirm-spiel.aktiv');
    if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
    ok((await page.getAttribute("#knopf-master", "aria-pressed")) === "true", "Sandro nach Neuladen: Master weiter an (je Profil gespeichert)");
  }
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
