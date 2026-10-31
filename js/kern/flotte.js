/* Sternenspiel – Kapitel 6: Flotte (Startbahnen/Hangar, Presets, Senden, Flüge). DOM-frei, in Node testbar. */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; };
  var FB = function () { return SS.BALANCE.FLOTTE; };

  // Presets (Sandro, pt29u). Sortierschlüssel = ANNAHME.
  var PRESETS = [
    { id: "gesunder_mix", name: "Gesunder Mix", text: "Kampfschiffe anteilig nach Bestand, Rest nach Feuerkraft" },
    { id: "starke_energie", name: "Starke Energiehülle", text: "Schiffe mit der stärksten Energiehülle zuerst" },
    { id: "starke_metall", name: "Starke Metallhülle", text: "Schiffe mit der stärksten Metallhülle zuerst" },
    { id: "max_feuerkraft", name: "Maximale Feuerkraft", text: "Schiffe mit dem höchsten Angriff zuerst" }
  ];
  var MISSIONEN = [
    { id: "kolonisieren", name: "Kolonisieren", text: "Braucht mindestens ein Kolonieschiff." },
    { id: "transportieren", name: "Transportieren", text: "Fliegt hin und kehrt zurück (Ladung folgt)." },
    { id: "stationieren", name: "Stationieren", text: "Schiffe bleiben auf einem anderen eigenen Planeten." },
    { id: "spionieren", name: "Spionieren", text: "Braucht mindestens eine Spionagesonde." },
    { id: "angriff", name: "Angriff", text: "Greift das Ziel an (Gegner folgen mit dem Weltraum-Kapitel)." },
    { id: "unterstuetzen", name: "Unterstützen", text: "Hilft am Ziel bei der Verteidigung (folgt mit Gegnern)." }
  ];
  var presetNachId = function (id) { return PRESETS.filter(function (x) { return x.id === id; })[0] || null; };
  var missionNachId = function (id) { return MISSIONEN.filter(function (x) { return x.id === id; })[0] || null; };
  var summe = function (o) { return Object.keys(o || {}).reduce(function (s, k) { return s + (o[k] || 0); }, 0); };

  /** Fliegt das Schiff? (Solarsatellit/stationär nicht) */
  function fliegt(s) { return !!(s && s.antrieb && !s.stationaer); }
  function preset(p) { return (p.flotte && presetNachId(p.flotte.preset)) ? p.flotte.preset : FB().STANDARD_PRESET; }
  function setzePreset(p, id) { if (!presetNachId(id)) return false; p.flotte = p.flotte || {}; p.flotte.preset = id; return true; }

  function eigeneFlotten(z, p) { return (z.flotten || []).filter(function (f) { return f.herkunft === p.id && !f.stationiert; }); }
  /** Startplätze, die durch Flotten dieses Planeten belegt sind (bis zur Rückkehr). */
  function belegt(z, p) { return eigeneFlotten(z, p).reduce(function (s, f) { return s + f.anzahl; }, 0); }
  function kapazitaet(p) { return SS.kern.bau.kapazitaet(p); }
  function frei(z, p) { return Math.max(0, kapazitaet(p) - belegt(z, p)); }

  /** Startbahnen nach Preset füllen (unsichtbarer Tausch – rein rechnerisch, nichts wird bewegt). */
  function verteile(z, schiffe, platz, presetId) {
    var liste = Object.keys(schiffe || {}).filter(function (id) { return schiffe[id] > 0 && fliegt(D().schiffNachId(id)); }).map(function (id) {
      var s = D().schiffNachId(id), w = SS.kern.werft.werte(z, s);
      return { id: id, n: schiffe[id], kampf: s.gruppe === "kampf", angriff: w.angriff, energie: w.energie, metall: w.metall };
    });
    var sp = {}, rest = Math.max(0, platz);
    var nimm = function (e, a) { a = Math.min(a, e.n - (sp[e.id] || 0), rest); if (a > 0) { sp[e.id] = (sp[e.id] || 0) + a; rest -= a; } };
    var schluessel = { starke_energie: "energie", starke_metall: "metall", max_feuerkraft: "angriff", gesunder_mix: "angriff" }[presetId] || "angriff";
    // ANNAHME: bewaffnete Kampfschiffe immer vor Hilfs-/Spezialschiffen; diese füllen nur übrige Plätze.
    var ordne = function (a, b) { return (b.kampf - a.kampf) || (b[schluessel] - a[schluessel]) || (b.angriff - a.angriff) || (a.id < b.id ? -1 : 1); };
    liste.sort(ordne);
    if (presetId === "gesunder_mix") {
      var kampf = liste.filter(function (e) { return e.kampf; }), ges = summe(kampf.reduce(function (o, e) { o[e.id] = e.n; return o; }, {}));
      var start = rest;
      if (ges > 0) kampf.forEach(function (e) { nimm(e, Math.floor(start * e.n / ges)); });
    }
    liste.forEach(function (e) { nimm(e, e.n); });
    var hg = {};
    Object.keys(schiffe || {}).forEach(function (id) { var r = (schiffe[id] || 0) - (sp[id] || 0); if (r > 0) hg[id] = r; });
    return { startplatz: sp, hangar: hg, belegt: platz - rest };
  }

  /**
   * Flottenfenster: Startbahnen (Kapazität minus unterwegs) + Hangar.
   * Sandro (pt29u): Ist eine eigene Flotte unterwegs, gibt es im Orbit KEINE Verteidigungsflotte (verteidigt = false).
   */
  function startbahnen(z, p) {
    var kap = kapazitaet(p), unterwegs = belegt(z, p), platz = Math.max(0, kap - unterwegs), pr = preset(p);
    var v = verteile(z, p.schiffe || {}, platz, pr);
    return { kapazitaet: kap, unterwegs: unterwegs, frei: platz, startplatz: v.startplatz, hangar: v.hangar, aufStartbahn: v.belegt,
      preset: pr, verteidigt: unterwegs === 0 };
  }

  // ---------- Entfernung, Flugzeit, Rohöl (OGame-ähnlich, ANNAHME) ----------
  function entfernung(a, b) {
    if (a.system !== b.system) return FB().DIST_SYSTEM_BASIS + FB().DIST_JE_SYSTEM * Math.abs(a.system - b.system);
    if (a.planet !== b.planet) return FB().DIST_PLANET_BASIS + FB().DIST_JE_PLANET * Math.abs(a.planet - b.planet);
    return FB().DIST_GLEICH;
  }
  function tempo(z, schiffe) {
    var t = Infinity;
    Object.keys(schiffe).forEach(function (id) { if (schiffe[id] > 0) t = Math.min(t, SS.kern.werft.werte(z, D().schiffNachId(id)).tempo); });
    return isFinite(t) ? t : 0;
  }
  function flugzeitMs(dist, v) { return v > 0 ? Math.round((FB().ZEIT_FAKTOR * Math.sqrt(10 * dist / v) + 10) * 1000 / FB().UNIVERSUM_TEMPO) : Infinity; }
  function verbrauch(schiffe, dist, hinUndZurueck) {
    var basis = Object.keys(schiffe).reduce(function (s, id) { return s + D().schiffNachId(id).verbrauch * schiffe[id]; }, 0);
    var einfach = 1 + Math.round(basis * dist / 35000 * FB().VERBRAUCH_FAKTOR);
    return einfach * (hinUndZurueck ? 2 : 1);
  }
  function herkunftKoord(z, p) {
    if (p.koordinaten) return p.koordinaten;
    var h = z.heimat || {}; return { sektor: h.sektor, system: h.system, planet: h.planet };
  }
  /** Eigene Planeten mit Koordinaten (für Ziel-Dropdown). */
  function eigenePlaneten(z) {
    return (z.planeten || []).map(function (p) { var k = herkunftKoord(z, p); return { id: p.id, name: p.name, sektor: k.sektor, system: k.system, planet: k.planet }; });
  }
  var gleicheKoord = function (a, b) { return a && b && a.sektor === b.sektor && a.system === b.system && a.planet === b.planet; };

  /** Vorschau + Prüfung eines Sendeauftrags. auftrag = {schiffe:{id:n}, ziel:{sektor,system,planet}, mission} */
  function pruefe(z, p, auftrag) {
    var schiffe = {}, anzahl = 0, fehler = null;
    Object.keys((auftrag && auftrag.schiffe) || {}).forEach(function (id) {
      var n = Math.floor(Number(auftrag.schiffe[id]) || 0), s = D().schiffNachId(id);
      if (n <= 0) return;
      if (!fliegt(s)) { fehler = fehler || ((s ? s.name : id) + " kann nicht fliegen."); return; }
      if (n > ((p.schiffe || {})[id] || 0)) { fehler = fehler || ("Nicht genug " + s.name + " am Planeten."); return; }
      schiffe[id] = n; anzahl += n;
    });
    var r = { ok: false, schiffe: schiffe, anzahl: anzahl, frei: frei(z, p), grund: "" };
    var ziel = auftrag && auftrag.ziel, mission = missionNachId(auftrag && auftrag.mission), start = herkunftKoord(z, p);
    if (fehler) { r.grund = fehler; return r; }
    if (!anzahl) { r.grund = "Keine Schiffe ausgewählt."; return r; }
    if (anzahl > r.frei) { r.grund = "Nur " + r.frei + " Startplätze frei (" + anzahl + " gewählt)."; return r; }
    if (!ziel || !D().weltraum.leseKoordinaten(D().weltraum.koordinatenText(ziel))) { r.grund = "Ungültiges Ziel."; return r; }
    if (!mission) { r.grund = "Mission wählen."; return r; }
    var zielEigen = eigenePlaneten(z).filter(function (e) { return gleicheKoord(e, ziel); })[0];
    if (gleicheKoord(start, ziel)) { r.grund = "Ziel ist der Startplanet."; return r; }
    if (mission.id === "kolonisieren" && !schiffe.kolonieschiff) { r.grund = "Kolonisieren braucht ein Kolonieschiff."; return r; }
    if (mission.id === "kolonisieren" && zielEigen) { r.grund = "Planet gehört dir schon."; return r; }
    if (mission.id === "spionieren" && !schiffe.spionagesonde) { r.grund = "Spionieren braucht eine Spionagesonde."; return r; }
    if (mission.id === "stationieren" && !zielEigen) { r.grund = "Stationieren nur auf einem anderen eigenen Planeten."; return r; }
    if ((mission.id === "angriff") && zielEigen) { r.grund = "Eigene Planeten kann man nicht angreifen."; return r; }
    var dist = entfernung(start, ziel), v = tempo(z, schiffe), master = SS.kern.werft.istMaster(z);
    r.entfernung = dist; r.tempo = v; r.dauer = flugzeitMs(dist, v);
    r.rohoel = master ? 0 : verbrauch(schiffe, dist, mission.id !== "stationieren");
    if (r.rohoel > (z.rohstoffe.rohoel || 0)) { r.grund = "Nicht genug Rohöl (" + r.rohoel + " nötig)."; return r; }
    r.ok = true; r.mission = mission; r.ziel = { sektor: ziel.sektor, system: ziel.system, planet: ziel.planet }; r.zielEigen = zielEigen || null;
    return r;
  }

  function senden(z, p, auftrag, jetzt) {
    var r = pruefe(z, p, auftrag);
    if (!r.ok) return r;
    Object.keys(r.schiffe).forEach(function (id) { p.schiffe[id] -= r.schiffe[id]; if (p.schiffe[id] <= 0) delete p.schiffe[id]; });
    z.rohstoffe.rohoel -= r.rohoel;
    z.flottenZaehler = (z.flottenZaehler || 0) + 1;
    var f = { id: "f" + z.flottenZaehler, herkunft: p.id, start: herkunftKoord(z, p), ziel: r.ziel, zielName: auftrag.zielName || (r.zielEigen ? r.zielEigen.name : ""),
      mission: r.mission.id, schiffe: r.schiffe, anzahl: r.anzahl, abflug: jetzt, ankunft: jetzt + r.dauer, rueckkehr: null, phase: "hin" };
    z.flotten.push(f);
    r.flotte = f;
    return r;
  }

  /** Fortschritt eines Fluges (aktuelle Phase). */
  function status(f, jetzt) {
    var von = f.phase === "hin" ? f.abflug : f.ankunft, bis = f.phase === "hin" ? f.ankunft : f.rueckkehr;
    var dauer = Math.max(1, bis - von);
    return { phase: f.phase, rest: Math.max(0, bis - jetzt), prozent: Math.max(0, Math.min(100, (jetzt - von) / dauer * 100)), ende: bis };
  }

  function planetVonId(z, id) { return (z.planeten || []).filter(function (p) { return p.id === id; })[0] || null; }

  /** Ankünfte/Rückkehren bis jetzt abarbeiten. Liefert Meldungen {art:"flotte", name, text}. */
  function faellige(z, jetzt) {
    var meld = [];
    (z.flotten || []).slice().forEach(function (f) {
      var m = missionNachId(f.mission), ziel = D().weltraum.koordinatenText(f.ziel);
      if (f.phase === "hin" && jetzt >= f.ankunft) {
        var eigen = eigenePlaneten(z).filter(function (e) { return gleicheKoord(e, f.ziel); })[0];
        if (f.mission === "stationieren" && eigen) {
          var zp = planetVonId(z, eigen.id);
          Object.keys(f.schiffe).forEach(function (id) { zp.schiffe[id] = (zp.schiffe[id] || 0) + f.schiffe[id]; });
          z.flotten.splice(z.flotten.indexOf(f), 1);
          meld.push({ art: "flotte", name: m.name, text: "Flotte stationiert auf " + ziel });
          return;
        }
        // ANNAHME: Ohne Gegner/Kolonien (Weltraum-Kapitel) haben Missionen am Ziel noch keine Wirkung → Rückflug.
        f.phase = "rueck"; f.rueckkehr = f.ankunft + (f.ankunft - f.abflug);
        f.bericht = m.name + " bei " + ziel + ": " + (f.mission === "transportieren" || f.mission === "unterstuetzen" ? "Ziel erreicht" : "kein Gegner/keine Wirkung (folgt im Weltraum-Kapitel)");
        meld.push({ art: "flotte", name: m.name, text: "Flotte erreicht " + ziel + " (" + m.name + ")" });
      }
      if (f.phase === "rueck" && jetzt >= f.rueckkehr) {
        var hp = planetVonId(z, f.herkunft) || z.planeten[0];
        Object.keys(f.schiffe).forEach(function (id) { hp.schiffe[id] = (hp.schiffe[id] || 0) + f.schiffe[id]; });
        z.flotten.splice(z.flotten.indexOf(f), 1);
        meld.push({ art: "flotte", name: m.name, text: "Flotte zurück von " + ziel + " (" + m.name + ")" });
      }
    });
    return meld;
  }

  // ---------- Favoriten ----------
  function favoritHinzu(z, k, name) {
    if (!D().weltraum.leseKoordinaten(D().weltraum.koordinatenText(k || {}))) return false;
    z.favoriten = z.favoriten || [];
    if (z.favoriten.some(function (f) { return gleicheKoord(f, k); })) return false;
    z.favoriten.push({ name: String(name || D().weltraum.koordinatenText(k)).slice(0, 40), sektor: k.sektor, system: k.system, planet: k.planet });
    return true;
  }
  function favoritWeg(z, i) { if (!z.favoriten || !z.favoriten[i]) return false; z.favoriten.splice(i, 1); return true; }

  SS.kern.flotte = {
    PRESETS: PRESETS, MISSIONEN: MISSIONEN, presetNachId: presetNachId, missionNachId: missionNachId,
    fliegt: fliegt, preset: preset, setzePreset: setzePreset, belegt: belegt, frei: frei, verteile: verteile, startbahnen: startbahnen,
    entfernung: entfernung, tempo: tempo, flugzeitMs: flugzeitMs, verbrauch: verbrauch, herkunftKoord: herkunftKoord, eigenePlaneten: eigenePlaneten,
    pruefe: pruefe, senden: senden, status: status, faellige: faellige, favoritHinzu: favoritHinzu, favoritWeg: favoritWeg, summe: summe
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
