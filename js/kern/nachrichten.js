/*
 * Sternenspiel – Nachrichten (0.23.0, Sandro pt67u): zentrale Inbox wie OGame.
 * Datenmodell: z.nachrichten = [{ id, kat, zeit, titel, text, koord:{sektor,system,planet}|null, gelesen, von, daten }] (neueste zuerst).
 *   kat: "kampf" | "spionage" | "expedition" | "flotte" | "spieler" (Spieler-/System-/KI-Meldungen; Feld `von` für spätere echte Absender).
 *   daten: voller Kampf- bzw. Spionagebericht (gleiche Struktur wie z.kampfberichte / z.letzterSpionagebericht).
 * Limits: insgesamt MAX, je Kategorie MAX_KAT (Kampf/Spionage haben große Datensätze). DOM-frei (Node-Tests).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var KATEGORIEN = [
    { id: "kampf", name: "Kampfberichte", symbol: "⚔" },
    { id: "spionage", name: "Spionageberichte", symbol: "🔍" },
    { id: "expedition", name: "Expeditionen", symbol: "✦" },
    { id: "flotte", name: "Flottenmeldungen", symbol: "➤" },
    { id: "spieler", name: "Spielernachrichten", symbol: "✉" }
  ];
  var MAX = 300, MAX_KAT = { kampf: 50, spionage: 50, expedition: 100, flotte: 150, spieler: 100 };
  function katNachId(id) { for (var i = 0; i < KATEGORIEN.length; i++) if (KATEGORIEN[i].id === id) return KATEGORIEN[i]; return null; }
  function koord(k) { return k && isFinite(k.sektor) && isFinite(k.system) && isFinite(k.planet) ? { sektor: +k.sektor, system: +k.system, planet: +k.planet } : null; }

  function liste(z) { if (!Array.isArray(z.nachrichten)) z.nachrichten = []; return z.nachrichten; }
  function kuerze(z) {
    var l = liste(z), zaehl = {};
    z.nachrichten = l.filter(function (n) { zaehl[n.kat] = (zaehl[n.kat] || 0) + 1; return zaehl[n.kat] <= (MAX_KAT[n.kat] || 100); }).slice(0, MAX);
  }
  /** Neue Nachricht (neueste zuerst). o: {kat, titel, text, koord, zeit, daten, von, gelesen}. */
  function neu(z, o) {
    if (!katNachId(o.kat)) return null;
    z.nachrichtenZaehler = (z.nachrichtenZaehler || 0) + 1;
    var n = { id: "n" + z.nachrichtenZaehler, kat: o.kat, zeit: isFinite(o.zeit) ? o.zeit : Date.now(), titel: String(o.titel || ""), text: String(o.text || ""),
      koord: koord(o.koord), gelesen: o.gelesen === true, von: o.von || "System", daten: o.daten || null };
    liste(z).unshift(n); kuerze(z);
    return n;
  }
  function kt(k) { return k ? k.sektor + ":" + k.system + ":" + k.planet : ""; }
  function kampf(z, b) {
    var zk = b.ziel ? koord(b.ziel) : null, sieg = b.sieger === "angreifer" ? "Sieg" : b.sieger === "verteidiger" ? "Niederlage" : "Unentschieden";
    if (b.expedition) sieg = b.sieger === "angreifer" ? "Piraten abgewehrt" : b.rettung ? "Expeditionsflotte vernichtet" : sieg;
    return neu(z, { kat: "kampf", zeit: b.zeit, koord: zk, daten: b,
      titel: (b.expedition ? "Piratenangriff" : "Kampf") + (b.ziel && b.ziel.name ? " bei " + b.ziel.name : "") + (zk ? " [" + kt(zk) + "]" : ""), text: sieg });
  }
  function spionage(z, s) {
    return neu(z, { kat: "spionage", zeit: s.zeit, koord: s.koordinaten, daten: s, titel: "Spionagebericht " + (s.name || "") + " [" + kt(koord(s.koordinaten)) + "]", text: s.hinweis || "" });
  }
  function finde(z, id) { return liste(z).filter(function (n) { return n.id === id; })[0] || null; }
  function lesen(z, id) { var n = finde(z, id); if (n) n.gelesen = true; return n; }
  function ungelesen(z, kat) { return liste(z).filter(function (n) { return !n.gelesen && (!kat || n.kat === kat); }).length; }
  function loesche(z, ids) { var s = {}; ids.forEach(function (i) { s[i] = true; }); var vor = liste(z).length; z.nachrichten = liste(z).filter(function (n) { return !s[n.id]; }); return vor - z.nachrichten.length; }
  function loescheKat(z, kat, nurGelesene) { var vor = liste(z).length; z.nachrichten = liste(z).filter(function (n) { return !((!kat || n.kat === kat) && (!nurGelesene || n.gelesen)); }); return vor - z.nachrichten.length; }
  function alleGelesen(z, kat) { liste(z).forEach(function (n) { if (!kat || n.kat === kat) n.gelesen = true; }); }

  /** Platzhalter Spielernachricht (Solo): Begrüßung vom Flottenkommando – Struktur wie spätere echte Spieler-Nachrichten (von, titel, text). */
  function willkommen(z) {
    var k = z.heimat && isFinite(z.heimat.system) ? z.heimat : null;
    neu(z, { kat: "spieler", von: "Flottenkommando", zeit: (z.zeit && z.zeit.letzterTick) || Date.now(), koord: k && { sektor: k.sektor, system: k.system, planet: k.planet },
      titel: "Willkommen im Nachrichtenzentrum", text: "Hier sammeln sich Kampf-, Spionage-, Expeditions- und Flottenberichte. Koordinaten wie [1:1:1] sind anklickbar und öffnen die Weltraum-Ansicht. Spielernachrichten anderer Spieler folgen, sobald es Mitspieler gibt." });
  }
  /** Migration alter Saves: vorhandene Kampf-/Spionage-/Expeditionsberichte als (gelesene) Nachrichten übernehmen. */
  function migriere(z) {
    if (Array.isArray(z.nachrichten)) {
      z.nachrichten = z.nachrichten.filter(function (n) { return n && n.id && katNachId(n.kat); });
      z.nachrichtenZaehler = Math.max(Math.floor(Number(z.nachrichtenZaehler) || 0), z.nachrichten.length);
      return z;
    }
    z.nachrichten = [];
    var alt = [];
    (z.kampfberichte || []).forEach(function (b) { alt.push({ t: b.zeit || 0, f: function () { kampf(z, b); } }); });
    if (z.letzterSpionagebericht) alt.push({ t: z.letzterSpionagebericht.zeit || 0, f: function () { spionage(z, z.letzterSpionagebericht); } });
    (z.letzteExpeditionen || []).forEach(function (e) { alt.push({ t: e.zeit || 0, f: function () { neu(z, { kat: "expedition", zeit: e.zeit, koord: e.ziel, titel: "Expedition [" + kt(koord(e.ziel)) + "]", text: e.text }); } }); });
    alt.sort(function (a, b) { return a.t - b.t; }).forEach(function (a) { a.f(); });
    z.nachrichten.forEach(function (n) { n.gelesen = true; });
    willkommen(z);
    return z;
  }

  SS.kern.nachrichten = { KATEGORIEN: KATEGORIEN, MAX: MAX, MAX_KAT: MAX_KAT, katNachId: katNachId, neu: neu, kampf: kampf, spionage: spionage, finde: finde, lesen: lesen,
    ungelesen: ungelesen, willkommen: willkommen, loesche: loesche, loescheKat: loescheKat, alleGelesen: alleGelesen, migriere: migriere };
})(typeof globalThis !== "undefined" ? globalThis : this);
