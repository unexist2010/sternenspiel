// Browser-Playtest Kapitel 1 „Layout-Grundgerüst“ (Chromium headless über playwright-core, Seite per file:// – ohne Server).
// Prüft auf Handy 412×915 und Desktop 1366×768: alle 8 Menüseiten, Menü (Handy ausklappbar), Ressourcenleiste ohne Antimaterie,
// automatischer Start ohne Auswahl, Flotte mit Startplätze-Info, Weltraum-Navigation Universum → Sektor → System, Bilder geladen, keine Konsolenfehler, keine externen Anfragen,
// kein waagrechter Überlauf, Speichern/Offline/Zurücksetzen.
// Screenshots: playtest/kapitel1-layout-<geraet>-<seite>.png
// Aufruf: node tests/playtest-kapitel1-layout.js   (optional: CHROME=/pfad/zu/chrome, PLAYWRIGHT_CORE=/pfad/zu/playwright-core)
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
const { chromium } = ladePlaywright();
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/opt/google/chrome/chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const URL_ = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
const OUT = path.join(__dirname, "..", "playtest");
fs.mkdirSync(OUT, { recursive: true });

const MENUE = ["Übersicht", "Ressourcen", "Anlagen", "Forschung", "Werft", "Verteidigung", "Flotte", "Weltraum"];
const IDS = ["uebersicht", "ressourcen", "anlagen", "forschung", "werft", "verteidigung", "flotte", "weltraum"];
const KAPITEL = { anlagen: 2, forschung: 3, werft: 4, verteidigung: 5, flotte: 6 };

let fehlschlaege = 0, pruefungen = 0;
function ok(bed, text) { pruefungen++; console.log((bed ? "OK   " : "FAIL ") + text); if (!bed) fehlschlaege++; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GERAETE = [
  { name: "handy", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: "desktop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

async function lauf(browser, g) {
  console.log(`\n== ${g.name} ${g.viewport.width}×${g.viewport.height} ==`);
  const handy = g.name === "handy";
  const ctx = await browser.newContext({ viewport: g.viewport, isMobile: g.isMobile, hasTouch: g.hasTouch, deviceScaleFactor: g.deviceScaleFactor, locale: "de-DE", timezoneId: "Europe/Vienna" });
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") fehler.push("console." + m.type() + ": " + m.text()); });
  page.on("requestfailed", (r) => fehler.push("requestfailed: " + r.url()));
  page.on("request", (r) => { if (!r.url().startsWith("file:") && !r.url().startsWith("data:")) fehler.push("externe Anfrage: " + r.url()); });
  const shot = async (n) => { await sleep(300); await page.screenshot({ path: path.join(OUT, `kapitel1-layout-${g.name}-${n}.png`) }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const bilderOk = () => page.evaluate(() => [...document.images].filter((i) => i.offsetParent !== null && !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute("src")));
  const menueSichtbar = () => page.evaluate(() => { const r = document.getElementById("menue").getBoundingClientRect(); return r.right > 0 && r.left < window.innerWidth; });

  await page.goto(URL_);
  ok(await page.isVisible("#bildschirm-start"), "Startbildschirm sichtbar");
  await shot("start");

  ok(!(await page.$(".startplatz, #startplatz-raster, #bildschirm-neu")), "Keine Startplatz-/Planetenauswahl mehr vorhanden");
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  ok(await page.isVisible("#bildschirm-spiel"), "Neues Spiel startet direkt im Spiel (ohne Auswahl)");
  const heimat = await page.evaluate(() => window.SS.app.zustand.heimat);
  const koord = `${heimat.sektor}:${heimat.system}:${heimat.planet}`;
  ok(await page.evaluate((k) => !!window.SS.DATEN.weltraum.leseKoordinaten(k), koord), `Hauptplanet auf gültiger Koordinate [${koord}]`);
  ok(await page.evaluate(() => !("startplatz" in window.SS.app.zustand)), "Spielstand ohne altes Startplatz-Feld");

  // Menü-Reihenfolge und Ressourcenleiste
  const namen = await page.$$eval("#menue-liste a", (as) => as.map((a) => a.childNodes[0].textContent.trim()));
  ok(JSON.stringify(namen) === JSON.stringify(MENUE), "Menü: 8 Punkte in festgelegter Reihenfolge");
  const rs = await page.$$eval("#ressourcen-leiste .rs", (e) => e.map((x) => x.getAttribute("data-rohstoff")));
  ok(rs.length === 7 && !rs.includes("antimaterie"), "Ressourcenleiste: 7 Rohstoffe, Antimaterie versteckt");
  const reihen = await page.$$eval("#ressourcen-leiste .rs", (e) => new Set(e.map((x) => Math.round(x.getBoundingClientRect().top))).size);
  ok(handy ? reihen === 2 : reihen === 1, `Ressourcenleiste: ${handy ? "2 Reihen (4+3)" : "1 Reihe"} (ist ${reihen})`);
  ok(handy ? !(await menueSichtbar()) : await menueSichtbar(), handy ? "Handy: Menü anfangs eingeklappt" : "Desktop: Menü links fest sichtbar");

  for (let i = 0; i < IDS.length; i++) {
    const id = IDS[i];
    if (handy) {
      await page.click("#knopf-menue-auf");
      await sleep(260);
      ok(await menueSichtbar(), `Handy: Menü öffnet (${MENUE[i]})`);
      if (i === 0) await shot("menue-offen");
    }
    await page.click(`#menue-liste a[data-seite="${id}"]`);
    await page.waitForSelector(`#inhalt[data-seite="${id}"]`);
    await sleep(260);
    if (handy) ok(!(await menueSichtbar()), `Handy: Menü schließt nach Auswahl (${MENUE[i]})`);
    ok((await page.textContent("#inhalt h1")) === MENUE[i], `Seite „${MENUE[i]}“ geöffnet`);
    ok(await page.$eval(`#menue-liste a[data-seite="${id}"]`, (a) => a.classList.contains("aktiv")), `Menüpunkt „${MENUE[i]}“ aktiv markiert`);
    ok(await ueberlauf() <= 0, `„${MENUE[i]}“: kein waagrechter Überlauf`);
    const fehlend = await bilderOk();
    ok(fehlend.length === 0, `„${MENUE[i]}“: alle Bilder geladen` + (fehlend.length ? " – fehlt: " + fehlend.join(", ") : ""));
    const text = await page.textContent("#inhalt");
    if (KAPITEL[id]) ok(text.includes("Kommt in Kapitel " + KAPITEL[id]), `Platzhalter „${MENUE[i]}“: „Kommt in Kapitel ${KAPITEL[id]}“`);
    if (id === "uebersicht") {
      ok(text.includes("[" + koord + "]") && text.includes("Hauptplanet") && text.includes(heimat.name), "Übersicht: Hauptplanet + Koordinaten");
      ok(!/Startplatz|Schwerpunkt|Stufe/.test(text), "Übersicht: keine Startplatz/Stufe-Anzeige mehr");
    }
    if (id === "flotte") {
      const info = await page.textContent("#startplaetze-info");
      ok(info.includes("Startplätze") && info.includes("kommt in Kapitel 6") && info.includes("nur die Anzahl der Schiffe"), "Flotte: Info-Abschnitt Startplätze mit Regeln");
      const chips = await page.$$eval("#startplaetze-info .startplatz-chip", (e) => e.map((x) => x.getAttribute("data-buchstabe") + (x.classList.contains("frei") ? "+" : "")));
      ok(chips.join("") === "A+BCDEFGHIJ", "Flotte: Startplätze A–J, nur A freigeschaltet");
    }
    if (id === "ressourcen") {
      const zeilen = await page.$$eval("#rohstoff-tabelle tbody tr", (t) => t.map((x) => x.getAttribute("data-rohstoff")));
      ok(zeilen.length === 7 && !zeilen.includes("antimaterie"), "Ressourcen: Tabelle mit 7 Rohstoffen ohne Antimaterie");
      ok((await page.textContent('[data-live="rate:metall"]')) === "120" && !text.includes("Bonus"), "Ressourcen: Grundrate (Metall 120/Std.), keine Bonus-Spalte");
    }
    if (!/feldlimit|felder:|planetengr/i.test(text)) ok(true, `„${MENUE[i]}“: keine Planetengröße/Felder angezeigt`); else ok(false, `„${MENUE[i]}“ zeigt Größe/Felder`);
    await shot(id);
  }

  // Weltraum-Navigation
  ok((await page.$$eval(".sektor-karte", (e) => e.length)) === 5, "Weltraum: 5 Sektoren");
  ok((await page.textContent(".welt-kennzahlen")).includes("3.600"), "Weltraum: 3.600 Planeten angezeigt");
  await page.click(`.sektor-karte[data-sektor="${heimat.sektor}"]`);
  await page.waitForSelector("#system-raster");
  ok((await page.$$eval("#system-raster .system-knopf", (e) => e.length)) === 60, `Sektor ${heimat.sektor}: 60 Systeme`);
  ok((await page.$eval("#system-raster .system-knopf.heimat b", (b) => b.textContent)) === String(heimat.system), `Heimatsystem ${heimat.system} hervorgehoben`);
  ok(await ueberlauf() <= 0, "Sektor-Ansicht: kein waagrechter Überlauf");
  await shot("weltraum-sektor");
  await page.click("#system-raster .system-knopf.heimat");
  await page.waitForSelector("#planeten-tabelle");
  ok((await page.$$eval("#planeten-tabelle tbody tr", (e) => e.length)) === 12, `System ${heimat.system}: 12 Planeten`);
  ok((await page.$eval("#planeten-tabelle tr.heimat", (e) => e.getAttribute("data-position"))) === String(heimat.planet), `Hauptplanet auf Position ${heimat.planet} markiert`);
  ok(await ueberlauf() <= 0, "System-Ansicht: kein waagrechter Überlauf");
  ok((await bilderOk()).length === 0, "System-Ansicht: Bilder geladen");
  await shot("weltraum-system");
  await page.fill("#eingabe-system", "300");
  await page.click('#form-system button[type="submit"]');
  await page.waitForFunction(() => location.hash === "#weltraum/system/300" && document.querySelector(".brotkrumen").textContent.includes("System 300"));
  ok((await page.textContent(".brotkrumen")).includes("Epsilon"), "Sprung zu System 300 (Sektor Epsilon)");

  // Produktion, Speichern, Offline, Zurücksetzen (Unterbau)
  const m0 = await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall);
  await sleep(1600);
  ok((await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall)) > m0, "Produktion läuft im Hintergrund");
  if (handy) { await page.click("#knopf-menue-auf"); await sleep(260); }
  await page.click("#knopf-hauptmenue");
  ok(await page.isVisible("#knopf-weiterspielen"), "Hauptmenü speichert, „Weiterspielen“ sichtbar");
  const vorher = await page.evaluate(() => {
    const k = window.SS.BALANCE.SPEICHER_SCHLUESSEL, z = JSON.parse(localStorage.getItem(k));
    z.zeit.letzterTick -= 3 * 3600000; z.zeit.zuletztGespeichert -= 3 * 3600000;
    localStorage.setItem(k, JSON.stringify(z));
    return z.rohstoffe.metall;
  });
  await page.reload();
  await page.click("#knopf-weiterspielen");
  ok(await page.isVisible("#dialog"), "Willkommen-zurück-Dialog nach 3 Std. offline");
  const rate = await page.evaluate(() => window.SS.kern.produktion.produktionProStunde(window.SS.app.zustand).metall);
  const nachher = await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall);
  ok(nachher - vorher >= rate * 2.9, `Offline-Fortschritt (+${Math.round(nachher - vorher)} Metall)`);
  await page.click("#dialog-ok");
  await page.evaluate(() => { location.hash = "#uebersicht"; });
  await page.waitForSelector('#inhalt[data-seite="uebersicht"] [data-aktion="zuruecksetzen"]');
  await page.click('[data-aktion="zuruecksetzen"]');
  await page.click("#dialog-ok");
  ok(await page.isVisible("#bildschirm-start") && !(await page.isVisible("#knopf-weiterspielen")), "Zurücksetzen löscht Spielstand");

  ok(fehler.length === 0, "Keine Konsolen-/Seitenfehler, keine externen Anfragen" + (fehler.length ? ":\n  " + fehler.join("\n  ") : ""));
  await ctx.close();
}

(async () => {
  console.log("Chrome:", CHROME, "\nURL:", URL_);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try { for (const g of GERAETE) await lauf(browser, g); }
  finally { await browser.close(); }
  console.log(`\n${pruefungen - fehlschlaege}/${pruefungen} Prüfungen grün` + (fehlschlaege ? ` – ${fehlschlaege} FEHLGESCHLAGEN` : " – ALLE GRÜN"));
  process.exit(fehlschlaege ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
