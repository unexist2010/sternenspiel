// Browser-Playtest Kapitel 1 „reine Seitenstruktur“ (Chromium headless über playwright-core).
// Aufruf:  node tests/playtest-kapitel1-struktur.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-struktur.js
// Prüft auf Handy 412×915 und Desktop 1366×768: 8 Menüseiten in fester Reihenfolge, alle außer Übersicht nur Titel +
// neutraler Platzhalter, Übersicht = Hauptplanet + Koordinaten + Knöpfe, Ressourcenleiste nur Metall/Silizium/Rohöl/Strom,
// nichts von Startplätzen/Weltraum-Navigation/Rohstofftabelle/Kapitelnummern sichtbar, Menü auf/zu, kein Überlauf,
// keine Konsolenfehler/fremden Anfragen, Speichern/Offline/Zurücksetzen. Screenshots: playtest/kapitel1-final-*.png
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

const MENUE = ["Übersicht", "Ressourcen", "Anlagen", "Forschung", "Werft", "Verteidigung", "Flotte", "Weltraum"];
const IDS = ["uebersicht", "ressourcen", "anlagen", "forschung", "werft", "verteidigung", "flotte", "weltraum"];
const PLATZHALTER = "Wird in einem eigenen Kapitel ausgearbeitet.";

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
  page.on("request", (r) => { if (!r.url().startsWith(BASIS) && !r.url().startsWith("data:")) fehler.push("externe Anfrage: " + r.url()); });
  const shot = async (n) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; }); await sleep(350); await page.screenshot({ path: path.join(OUT, `kapitel1-final-${g.name}-${LIVE ? "live-" : ""}${n}.png`) }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const bilderOk = () => page.evaluate(() => [...document.images].filter((i) => i.offsetParent !== null && !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute("src")));
  const menueSichtbar = () => page.evaluate(() => { const r = document.getElementById("menue").getBoundingClientRect(); return r.right > 0 && r.left < window.innerWidth; });

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok(await page.isVisible("#bildschirm-start"), "Startbildschirm (Spielerauswahl) sichtbar");
  ok((await page.getAttribute("html", "data-version")) === "0.5.0" && (await page.evaluate(() => window.SS.VERSION)) === "0.5.0", "Version 0.5.0 (HTML = Skripte)");

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
  ok(JSON.stringify(rs) === '["metall","silizium","rohoel","strom"]', "Ressourcenleiste: nur Metall, Silizium, Rohöl, Strom (" + rs.join(",") + ")");
  ok(await page.evaluate(() => { const f = window.SS.app.zustand.freigeschaltet; return f.kunststoff_t1 === false && f.kunststoff_t2 === false && f.kunststoff_t3 === false && f.antimaterie === false && "kunststoff_t1" in window.SS.app.zustand.rohstoffe; }), "Kunststoff T1–T3 + Antimaterie per Flag ausgeblendet, im Datenmodell vorhanden");
  const reihen = await page.$$eval("#ressourcen-leiste .rs", (e) => new Set(e.map((x) => Math.round(x.getBoundingClientRect().top))).size);
  ok(reihen === 1, `Ressourcenleiste einreihig (ist ${reihen})`);
  ok(handy ? !(await menueSichtbar()) : await menueSichtbar(), handy ? "Handy: Menü anfangs eingeklappt" : "Desktop: Menü links fest sichtbar");
  ok(!/Kap\.|Kapitel \d/.test(await page.textContent("#menue")), "Menü ohne Kapitelnummern");

  const VERBOTEN = /Startpl|Kapitel \d|Kap\. \d|Sektor|Sonnensystem|Universum|pro Std|Bestand|Lager|Bonus|Feld|Planetengr/;
  for (let i = 0; i < IDS.length; i++) {
    const id = IDS[i];
    if (handy) {
      await page.click("#knopf-menue-auf");
      await sleep(280);
      ok(await menueSichtbar(), `Handy: Menü öffnet (${MENUE[i]})`);
      if (i === 0) await shot("menue-offen");
    }
    await page.click(`#menue-liste a[data-seite="${id}"]`);
    await page.waitForSelector(`#inhalt[data-seite="${id}"]`);
    await sleep(280);
    if (handy) ok(!(await menueSichtbar()), `Handy: Menü schließt nach Auswahl (${MENUE[i]})`);
    ok((await page.textContent("#inhalt h1")) === MENUE[i], `Seite „${MENUE[i]}“ geöffnet (eigener Titel)`);
    ok(await page.$eval(`#menue-liste a[data-seite="${id}"]`, (a) => a.classList.contains("aktiv")), `Menüpunkt „${MENUE[i]}“ aktiv markiert`);
    ok(await ueberlauf() <= 0, `„${MENUE[i]}“: kein waagrechter Überlauf`);
    const fehlend = await bilderOk();
    ok(fehlend.length === 0, `„${MENUE[i]}“: alle Bilder geladen` + (fehlend.length ? " – fehlt: " + fehlend.join(", ") : ""));
    const text = (await page.textContent("#inhalt")).replace(/\s+/g, " ");
    ok(!VERBOTEN.test(text), `„${MENUE[i]}“: keine Inhalte späterer Kapitel` + (VERBOTEN.test(text) ? " – gefunden: " + text.match(VERBOTEN)[0] : ""));
    if (id === "uebersicht") {
      ok(text.includes("[" + koord + "]") && text.includes(heimat.name), "Übersicht: Hauptplanetname + Koordinaten");
      const knoepfe = await page.$$eval("#inhalt button", (b) => b.map((x) => x.textContent.trim()));
      ok(JSON.stringify(knoepfe) === '["Speichern","Spieler wechseln","Zurücksetzen"]', "Übersicht: nur Knöpfe Speichern / Spieler wechseln / Zurücksetzen");
      ok((await page.$$eval("#inhalt .box", (b) => b.length)) === 2 && !(await page.$("#inhalt table, #inhalt a")), "Übersicht: keine Tabellen/Links/weiteren Kästen");
      if (!handy) await shot("uebersicht");
    } else {
      ok(text.replace(/\s/g, "") === (MENUE[i] + MENUE[i] + PLATZHALTER).replace(/\s/g, ""), `„${MENUE[i]}“: nur Titel + neutraler Platzhalter`);
      ok(!(await page.$("#inhalt table, #inhalt form, #inhalt img, #inhalt a, #inhalt button, #startplaetze-info")), `„${MENUE[i]}“: keine Tabellen/Formulare/Bilder/Links`);
      if (!handy && id === "ressourcen") await shot("leere-seite");
    }
  }
  await page.evaluate(() => { location.hash = "#weltraum/system/133"; });
  await page.waitForFunction(() => document.querySelector("#inhalt").getAttribute("data-seite") === "weltraum");
  ok(!(await page.$("#system-raster, #planeten-tabelle, .sektor-karte")) && (await page.textContent("#inhalt")).includes(PLATZHALTER), "Alter Weltraum-Link (#weltraum/system/133) zeigt nur den Platzhalter");
  ok(await page.evaluate(() => { const W = window.SS.DATEN.weltraum, h = window.SS.app.zustand.heimat; return W.universum().sektoren.length === 5 && !!W.system(300) && W.system(1).planeten.length === 12 && !!W.leseKoordinaten(W.koordinatenText(h)); }), "Weltraum-Hierarchie 1/5/300/12 im Datenmodell, Hauptplanet darin verortet");
  if (handy) {
    await page.evaluate(() => { location.hash = "#uebersicht"; });
    await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
    await shot("uebersicht");
  }

  // Produktion, Speichern, Offline, Zurücksetzen (Unterbau)
  const m0 = await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall);
  await sleep(1600);
  ok((await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall)) > m0, "Produktion läuft im Hintergrund");
  if (handy) { await page.click("#knopf-menue-auf"); await sleep(260); }
  await page.click("#knopf-spieler-wechseln");
  ok(await page.isVisible('#profil-liste [data-aktion="spielen"]'), "„Spieler wechseln“ speichert und zeigt die Spielerauswahl");
  const vorher = await page.evaluate(() => {
    const B = window.SS.BALANCE, idx = JSON.parse(localStorage.getItem(B.PROFIL_INDEX_SCHLUESSEL));
    const k = B.PROFIL_SPIELSTAND_PRAEFIX + idx.profile[0].id, z = JSON.parse(localStorage.getItem(k));
    z.zeit.letzterTick -= 3 * 3600000; z.zeit.zuletztGespeichert -= 3 * 3600000;
    localStorage.setItem(k, JSON.stringify(z));
    return z.rohstoffe.metall;
  });
  await page.reload();
  await page.click('#profil-liste [data-aktion="spielen"]');
  ok(await page.isVisible("#dialog"), "Willkommen-zurück-Dialog nach 3 Std. offline");
  const rate = await page.evaluate(() => window.SS.kern.produktion.produktionProStunde(window.SS.app.zustand).metall);
  const nachher = await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall);
  ok(nachher - vorher >= rate * 2.9, `Offline-Fortschritt (+${Math.round(nachher - vorher)} Metall)`);
  await page.click("#dialog-ok");
  await page.evaluate(() => { location.hash = "#uebersicht"; });
  await page.waitForSelector('#inhalt[data-seite="uebersicht"] [data-aktion="zuruecksetzen"]');
  await page.click('[data-aktion="zuruecksetzen"]');
  await page.click("#dialog-ok");
  await sleep(200);
  const nachReset = await page.evaluate(() => ({ m: window.SS.app.zustand.rohstoffe.metall, h: window.SS.app.zustand.heimat }));
  ok(await page.isVisible("#bildschirm-spiel") && nachReset.m < 520 && JSON.stringify(nachReset.h) === JSON.stringify(heimat), "Zurücksetzen: Rohstoffe auf Start, Name/Hauptplanet bleiben");

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
