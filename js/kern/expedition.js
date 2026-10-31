/*
 * Sternenspiel – Expeditionen (0.15.0, Sandro pt36u „Bau es mal“). DOM-frei, in Node testbar.
 * FEST (Sandro): Freischaltung Astrophysik; parallel = floor(√Stufe); Haltezeit an Astrophysik gekoppelt;
 *   längere Haltezeit = höhere Fundchance (nicht Fundgröße); Schiffs-Pool = baubar + 1 darüber;
 *   Kunststoff nur T1/T2; Fundmenge an eigene Punkte gedeckelt; Gegner nur Piraten; KEIN Totalverlust-Event.
 * ANNAHME (alle Zahlen in SS.BALANCE.EXPEDITION): Ziel = Position 13 eines Systems (Planeten 1–12, „Expeditionsraum“, OGame Pos. 16),
 *   Haltezeit 1…Stufe Stunden, Event-Gewichte, Cap-Faktoren, Piratenstärke, Antimaterie weggelassen.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; };
  var EB = function () { return SS.BALANCE.EXPEDITION; };
  var FO = function () { return SS.kern.forschung; };

  function stufe(z) { return FO().stufe(z, "astrophysik"); }
  function freigeschaltet(z) { return stufe(z) >= 1; }
  function maxParallel(z) { return Math.floor(Math.sqrt(stufe(z))); }
  function aktive(z) { return (z.flotten || []).filter(function (f) { return f.mission === "expedition"; }).length; }
  function maxHalten(z) { return Math.max(1, Math.min(EB().MAX_HALTEN_STUNDEN, stufe(z))); }
  /** Fundchance (0..1) nach Haltezeit in Stunden – länger halten = höhere Chance. */
  function fundChance(h) { var e = EB(); return Math.min(e.FUND_MAX, e.FUND_BASIS + e.FUND_JE_STUNDE * (Math.max(1, h) - 1)); }
  function istZiel(k) { return !!k && k.planet === EB().POSITION; }
  /** „S:SYS:13“ → Ziel-Koordinate oder null */
  function leseZiel(text) {
    var m = /^\s*(\d+)\s*:\s*(\d+)\s*:\s*(\d+)\s*$/.exec(String(text || "")); if (!m || +m[3] !== EB().POSITION) return null;
    var basis = D().weltraum.leseKoordinaten(m[1] + ":" + m[2] + ":1");
    return basis ? { sektor: basis.sektor, system: basis.system, planet: EB().POSITION } : null;
  }
  /** Prüfung für Mission Expedition → Fehlertext oder "" */
  function pruefe(z, ziel, halten) {
    if (!freigeschaltet(z)) return "Expedition braucht Astrophysik Stufe 1.";
    if (!istZiel(ziel)) return "Expeditionen fliegen nur in den Expeditionsraum (Position " + EB().POSITION + ", z. B. " + ziel.sektor + ":" + ziel.system + ":" + EB().POSITION + ").";
    if (aktive(z) >= maxParallel(z)) return "Maximal " + maxParallel(z) + " Expedition(en) gleichzeitig (√ Astrophysik " + stufe(z) + ").";
    if (!(halten >= 1 && halten <= maxHalten(z))) return "Haltezeit 1–" + maxHalten(z) + " h (Astrophysik " + stufe(z) + ").";
    return "";
  }

  var wert = function (k) { return Object.keys(k || {}).reduce(function (s, r) { return s + (k[r] || 0); }, 0); };
  /** Schiffs-Pool: alle fliegenden Schiffe mit erfüllten Voraussetzungen + das günstigste noch nicht baubare (eins darüber). */
  function schiffPool(z) {
    var p = z.planeten.reduce(function (best, x) { return ((x.gebaeude || {}).werft || 0) > ((best.gebaeude || {}).werft || 0) ? x : best; }, z.planeten[0]);
    var aus = EB().AUSSCHLUSS, W = SS.kern.werft;
    var kand = D().schiffe.filter(function (s) { return s.antrieb && !s.stationaer && aus.indexOf(s.id) < 0 && W.sichtbar(z, s); });
    var baubar = kand.filter(function (s) { return W.voraussetzungenOk(z, p, s); });
    var rest = kand.filter(function (s) { return baubar.indexOf(s) < 0; }).sort(function (a, b) { return wert(a.kosten) - wert(b.kosten); });
    return baubar.concat(rest.slice(0, 1));
  }
  /** Fund-Obergrenze in Rohstoff-Einheiten aus eigenen Punkten (OGame-ähnlicher Punkte-Cap). */
  function cap(z) { return Math.max(EB().CAP_MIN, Math.floor((z.punkte || 0) * EB().CAP_JE_PUNKT)); }

  function wurf(gewichte, r) { var s = 0, ges = gewichte.reduce(function (a, x) { return a + x[1]; }, 0), t = r() * ges; for (var i = 0; i < gewichte.length; i++) { s += gewichte[i][1]; if (t < s) return gewichte[i][0]; } return gewichte[gewichte.length - 1][0]; }

  function rohstoffFund(z, f, r) {
    var kap = SS.kern.flotte.ladekapazitaet(f.schiffe) - wert(f.ladung), menge = Math.floor(cap(z) * (EB().GROESSE_MIN + r() * (1 - EB().GROESSE_MIN)));
    var art = wurf(EB().ROHSTOFFE.map(function (x) { return [x.id, x.gewicht]; }), r);
    var faktor = EB().ROHSTOFFE.filter(function (x) { return x.id === art; })[0].faktor;
    var gefunden = Math.max(0, Math.floor(menge * faktor)), n = Math.max(0, Math.min(gefunden, kap)), rn = D().rohstoffNachId(art).name, F = SS.format && SS.format.zahl ? SS.format.zahl : String;
    if (!n) return { art: "nichts", gefunden: gefunden, text: F(gefunden) + " " + rn + " gefunden, aber kein Laderaum frei – nichts aufgenommen." };
    f.ladung = f.ladung || {}; f.ladung[art] = (f.ladung[art] || 0) + n;
    var gekappt = n < gefunden; // 0.15.1: Laderaum begrenzt den Fund → klar benennen
    return { art: "rohstoffe", rohstoffe: (function () { var o = {}; o[art] = n; return o; })(), gefunden: gefunden, gekappt: gekappt,
      text: gekappt ? F(gefunden) + " " + rn + " gefunden, " + F(n) + " aufgenommen – Laderaum voll" : "Fund: " + F(n) + " " + rn };
  }
  function schiffFund(z, f, r) {
    var pool = schiffPool(z); if (!pool.length) return { art: "nichts", text: "Wracks gesichtet, nichts Brauchbares." };
    var budget = Math.floor(cap(z) * EB().SCHIFF_CAP_ANTEIL * (EB().GROESSE_MIN + r() * (1 - EB().GROESSE_MIN))), neu = {};
    for (var v = 0; v < 200; v++) {
      var bez = pool.filter(function (s) { return wert(s.kosten) <= budget; }); if (!bez.length) break;
      var s = bez[Math.floor(r() * bez.length)]; neu[s.id] = (neu[s.id] || 0) + 1; budget -= wert(s.kosten);
    }
    if (!Object.keys(neu).length) { var g = pool.slice().sort(function (a, b) { return wert(a.kosten) - wert(b.kosten); })[0]; neu[g.id] = 1; } // mindestens 1 (günstigstes)
    Object.keys(neu).forEach(function (id) { f.schiffe[id] = (f.schiffe[id] || 0) + neu[id]; f.anzahl += neu[id]; });
    return { art: "schiffe", schiffe: neu, text: "Schiffe gefunden: " + Object.keys(neu).map(function (id) { return D().schiffNachId(id).name + " " + neu[id]; }).join(", ") };
  }
  /** Piraten (einziger Gegner): bestehender Kampfkern, Expedition = Angreifer. KEIN Totalverlust: mind. 1 Schiff überlebt. */
  function piraten(z, f, r, jetzt) {
    var kampf = Object.keys(f.schiffe).filter(function (id) { return D().schiffNachId(id).gruppe === "kampf"; });
    var staerke = kampf.reduce(function (s, id) { return s + D().schiffNachId(id).angriff * f.schiffe[id]; }, 0) * (EB().PIRATEN_MIN + r() * (EB().PIRATEN_MAX - EB().PIRATEN_MIN));
    var typen = ["korvette", "fregatte", "zerstoerer"].filter(function (id) { return D().schiffNachId(id); }), pir = {};
    var a = D().schiffNachId(typen[0]).angriff, n = Math.max(1, Math.round(Math.max(staerke, a * 2) / a));
    typen.forEach(function (id, i) { var k = Math.max(i ? 0 : 1, Math.floor(n * [0.6, 0.3, 0.1][i] * a / D().schiffNachId(id).angriff)); if (k) pir[id] = k; });
    var gg = { id: "piraten", name: "Piraten", schiffe: pir, verteidigung: {}, solarsatelliten: 0 };
    var kp = SS.kern.testphase.kampfPlanet(gg), vorher = JSON.parse(JSON.stringify(f.schiffe));
    var b = SS.kern.kampf.simuliere(kp.z, kp.p, { angreifer: f.schiffe, angreiferZustand: z });
    b.zeit = jetzt; b.ziel = { id: "piraten", name: "Piraten (Expedition)", sektor: f.ziel.sektor, system: f.ziel.system, planet: f.ziel.planet }; b.flotte = f.id; b.expedition = true;
    b.angreifer.forEach(function (x) { f.schiffe[x.id] = x.nachher; if (!f.schiffe[x.id]) delete f.schiffe[x.id]; });
    if (!Object.keys(f.schiffe).length) { // Sandro: kein Totalverlust → stärkster Typ behält 1 Schiff
      var best = Object.keys(vorher).sort(function (x, y) { return vorher[y] - vorher[x]; })[0]; f.schiffe[best] = 1; b.rettung = best;
    }
    f.anzahl = wert(f.schiffe);
    if (f.ladung) { var kap = SS.kern.flotte.ladekapazitaet(f.schiffe), l = wert(f.ladung); if (l > kap) Object.keys(f.ladung).forEach(function (rid) { f.ladung[rid] = Math.floor(f.ladung[rid] * kap / l); }); }
    merkeKampfbericht(z, b); f.kampfbericht = b;
    var verl = wert(vorher) - f.anzahl, von = " von " + wert(vorher);
    // 0.15.1: „Entkommen“ ist eine Niederlage, kein Unentschieden – Text und Bericht passen zusammen.
    if (b.rettung) return { art: "piraten", text: verl ? "Piratenangriff! Niederlage – Flotte vernichtet, 1 " + D().schiffNachId(b.rettung).name + " entkommen (" + verl + von + " Schiffen verloren)"
      : "Piratenangriff! Niederlage – " + D().schiffNachId(b.rettung).name + " (einziges Schiff) entkommt knapp" };
    return { art: "piraten", text: "Piratenangriff! " + ({ angreifer: "Piraten abgewehrt", verteidiger: "Rückzug vor den Piraten", unentschieden: "Unentschieden" }[b.sieger]) + " – " + verl + von + " Schiffen verloren" };
  }

  /** 0.15.1: Kampfberichte-Liste (neueste zuerst, max. 10) + letzterKampfbericht. */
  function merkeKampfbericht(z, b) { z.letzterKampfbericht = b; z.kampfberichte = [b].concat((z.kampfberichte || []).filter(function (x) { return x !== b; })).slice(0, 10); }

  /** Ereignis am Ende der Haltezeit. r = Zufall 0..1 (Tests: fest). Liefert {art, text, ...}; Verzögerung setzt f.verzoegerung (Faktor auf Rückflug). */
  function ereignis(z, f, jetzt, r) {
    r = r || Math.random;
    var e = EB(), h = f.halten || 1;
    if (r() < fundChance(h)) return wurf([["rohstoffe", e.ANTEIL_ROHSTOFFE], ["schiffe", e.ANTEIL_SCHIFFE]], r) === "schiffe" ? schiffFund(z, f, r) : rohstoffFund(z, f, r);
    var art = wurf([["piraten", e.GEWICHT_PIRATEN], ["verzoegerung", e.GEWICHT_VERZOEGERUNG], ["nichts", e.GEWICHT_NICHTS]], r);
    if (art === "piraten") return piraten(z, f, r, jetzt);
    if (art === "verzoegerung") {
      // 0.15.1: Master fliegt sofort (Flugzeit 0) → ehrlicher Text statt Fake-„dauert länger“.
      if (SS.kern.werft.istMaster(z)) return { art: "verzoegerung", text: "Antriebsstörung – Rückflug würde " + e.VERZOEGERUNG_FAKTOR + "× so lang dauern (Master-Modus: entfällt, sofort zurück)." };
      f.verzoegerung = e.VERZOEGERUNG_FAKTOR; return { art: "verzoegerung", text: "Antriebsstörung – Rückflug dauert " + e.VERZOEGERUNG_FAKTOR + "× so lang." };
    }
    return { art: "nichts", text: "Die Expedition fand nichts außer leerem Raum." };
  }

  SS.kern.expedition = { stufe: stufe, freigeschaltet: freigeschaltet, maxParallel: maxParallel, aktive: aktive, maxHalten: maxHalten, fundChance: fundChance,
    istZiel: istZiel, leseZiel: leseZiel, pruefe: pruefe, schiffPool: schiffPool, cap: cap, ereignis: ereignis, merkeKampfbericht: merkeKampfbericht };
})(typeof globalThis !== "undefined" ? globalThis : this);
