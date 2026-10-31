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
    { id: "kolonisieren", name: "Kolonisieren", text: "Braucht ein Kolonieschiff und einen leeren Platz (Position 1–12). Bei Ankunft entsteht ein neuer Planet: das Kolonieschiff wird verbraucht, die übrige Flotte bleibt dort stationiert, die Ladung wird entladen. Limit: aufgerundet Astrophysik / 2 Kolonien." },
    { id: "transportieren", name: "Transportieren", text: "Hin und zurück: Ladung wird am Ziel sofort entladen, die Flotte kehrt automatisch zurück." },
    { id: "stationieren", name: "Stationieren", text: "Nur Hinflug: Schiffe bleiben auf einem anderen eigenen Planeten." },
    { id: "spionieren", name: "Spionieren", text: "Braucht mindestens eine Spionagesonde. Gegen Testgegner: Spionagebericht (Schiffe + Verteidigung), danach Rückflug." },
    { id: "angriff", name: "Angriff", text: "Greift das Ziel an: gegen Testgegner echter Kampf (Phase 1 Orbit + Phase 2 Boden) mit Kampfbericht und Trümmern; Überlebende fliegen zurück." },
    { id: "sammeln", name: "Wracksammlung", text: "Nur Wracksammler. Sammelt Orbit-Trümmer (Schiffswracks) an eigenen Koordinaten oder einem fremden Trümmerfeld bis zur Ladekapazität und bringt sie heim. Boden-Schrott gehört immer dem Planetenbesitzer." },
    { id: "bodensammlung", name: "Bodensammlung", text: "Nur Bodensammler, nur eigene Koordinaten (auch der aktuelle Planet). Sammelt Boden-Schrott (zerstörte Verteidigung) bis zur Ladekapazität und bringt ihn ins Lager." },
    { id: "expedition", name: "Expedition", text: "Braucht Astrophysik. Ziel: Expeditionsraum (Position 13 eines Systems). Hält dort 1…Stufe Stunden – länger = höhere Fundchance (Rohstoffe inkl. Kunststoff T1/T2, Schiffe), Risiko: Piraten, Verzögerung." },
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
   * Sandro (t30u, FEST): Nur wenn ALLE Startplätze durch Flotten unterwegs belegt sind, gibt es KEINE Verteidigungsflotte.
   * Teilbelegung (z. B. 70 von 100) → die übrigen 30 Startbahn-Schiffe verteidigen.
   */
  function startbahnen(z, p) {
    var kap = kapazitaet(p), unterwegs = belegt(z, p), platz = Math.max(0, kap - unterwegs), pr = preset(p);
    var v = verteile(z, p.schiffe || {}, platz, pr);
    return { kapazitaet: kap, unterwegs: unterwegs, frei: platz, startplatz: v.startplatz, hangar: v.hangar, aufStartbahn: v.belegt,
      preset: pr, verteidigt: unterwegs === 0 || platz > 0 };
  }

  // ---------- Entfernung, Flugzeit, Rohöl (OGame-Formeln, FEST Sandro t30u; Tempo je Schiff verschieden, langsamstes zählt) ----------
  function entfernung(a, b) {
    // 0.18.0 (Sandro t49u): Expeditionsraum im eigenen System – gleiche Strecke von jeder Position (≈ 60 min frühe Schiffe)
    var EP = SS.BALANCE.EXPEDITION && SS.BALANCE.EXPEDITION.POSITION;
    if (a.system === b.system && a.sektor === b.sektor && (b.planet === EP || a.planet === EP) && a.planet !== b.planet) return FB().DIST_EXPEDITION_EIGEN;
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
    return (z.planeten || []).map(function (p) { var k = herkunftKoord(z, p); return { id: p.id, name: p.name || (p.istHauptplanet && z.heimat ? z.heimat.name : ""), sektor: k.sektor, system: k.system, planet: k.planet }; });
  }
  var gleicheKoord = function (a, b) { return a && b && a.sektor === b.sektor && a.system === b.system && a.planet === b.planet; };

  /** Ladekapazität der gewählten Schiffe. */
  function ladekapazitaet(schiffe) { return Object.keys(schiffe).reduce(function (s, id) { return s + (D().schiffNachId(id).ladung || 0) * schiffe[id]; }, 0); }
  /** Hin + Rück? Stationieren = nur Hinflug (OGame), alles andere hin und zurück. */
  function hinUndZurueck(missionId) { return missionId !== "stationieren" && missionId !== "kolonisieren"; } // 0.18.0: Kolonisieren = nur Hinflug (Rückflug nur bei Fehlschlag, gratis)

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
    var EX = SS.kern.expedition, halten = Math.floor(Number(auftrag && auftrag.halten) || 1);
    if (mission && mission.id === "expedition") { var eg = !ziel ? "Ziel: Expeditionsraum S:SYS:" + SS.BALANCE.EXPEDITION.POSITION + " eingeben." : EX.pruefe(z, ziel, halten); if (eg) { r.grund = eg; return r; } r.halten = halten; }
    else if (!ziel || !D().weltraum.leseKoordinaten(D().weltraum.koordinatenText(ziel))) { r.grund = "Ungültiges Ziel."; return r; }
    if (!mission) { r.grund = "Mission wählen."; return r; }
    var zielEigen = eigenePlaneten(z).filter(function (e) { return gleicheKoord(e, ziel); })[0];
    var bergung = mission.id === "sammeln" || mission.id === "bodensammlung";
    if (gleicheKoord(start, ziel) && !bergung) { r.grund = "Ziel ist der Startplanet."; return r; }
    if (mission.id === "kolonisieren" && !schiffe.kolonieschiff) { r.grund = "Kolonisieren braucht ein Kolonieschiff."; return r; }
    if (mission.id === "kolonisieren" && zielEigen) { r.grund = "Planet gehört dir schon."; return r; }
    if (mission.id === "kolonisieren" && SS.kern.kolonie) { var kg = SS.kern.kolonie.pruefe(z, ziel); if (kg) { r.grund = kg; return r; } }
    if (mission.id === "spionieren" && !schiffe.spionagesonde) { r.grund = "Spionieren braucht eine Spionagesonde."; return r; }
    if (mission.id === "sammeln" && (!schiffe.wracksammler || anzahl !== schiffe.wracksammler)) { r.grund = "Wracksammlung: nur Wracksammler (keine anderen Schiffe)."; return r; }
    if (mission.id === "bodensammlung" && (!schiffe.bodensammler || anzahl !== schiffe.bodensammler)) { r.grund = "Bodensammlung: nur Bodensammler (keine anderen Schiffe)."; return r; }
    if (mission.id === "bodensammlung" && !zielEigen) { r.grund = "Bodensammlung nur an eigenen Koordinaten."; return r; }
    if (mission.id === "stationieren" && !zielEigen) { r.grund = "Stationieren nur auf einem anderen eigenen Planeten."; return r; }
    if ((mission.id === "angriff") && zielEigen) { r.grund = "Eigene Planeten kann man nicht angreifen."; return r; }
    var dist = entfernung(start, ziel), v = tempo(z, schiffe), master = SS.kern.werft.istMaster(z);
    r.entfernung = dist; r.tempo = v; r.dauer = flugzeitMs(dist, v);
    if (master) r.dauer = 0; // Master: Flugzeit sofort (Sandro t30u)
    r.rohoel = master ? 0 : verbrauch(schiffe, dist, hinUndZurueck(mission.id));
    r.kapazitaet = ladekapazitaet(schiffe);
    var ladung = {}, lsum = 0;
    if (mission.id === "transportieren" || mission.id === "kolonisieren" || mission.id === "stationieren") Object.keys((auftrag && auftrag.ladung) || {}).forEach(function (rid) {
      var n = Math.floor(Number(auftrag.ladung[rid]) || 0); if (n > 0 && rid !== "strom" && rid in z.rohstoffe) { ladung[rid] = n; lsum += n; } });
    r.ladung = ladung; r.ladungSumme = lsum;
    if (lsum > r.kapazitaet) { r.grund = "Ladung " + lsum + " > Ladekapazität " + r.kapazitaet + "."; return r; }
    var knapp = Object.keys(ladung).filter(function (rid) { return ladung[rid] + (rid === "rohoel" ? r.rohoel : 0) > (z.rohstoffe[rid] || 0); })[0];
    if (knapp) { r.grund = "Nicht genug " + knapp + " für die Ladung."; return r; }
    if (r.rohoel > (z.rohstoffe.rohoel || 0)) { r.grund = "Nicht genug Rohöl (" + r.rohoel + " nötig)."; return r; }
    r.ok = true; r.mission = mission; r.ziel = { sektor: ziel.sektor, system: ziel.system, planet: ziel.planet }; r.zielEigen = zielEigen || null;
    return r;
  }

  function senden(z, p, auftrag, jetzt) {
    var r = pruefe(z, p, auftrag);
    if (!r.ok) return r;
    Object.keys(r.schiffe).forEach(function (id) { p.schiffe[id] -= r.schiffe[id]; if (p.schiffe[id] <= 0) delete p.schiffe[id]; });
    z.rohstoffe.rohoel -= r.rohoel;
    Object.keys(r.ladung).forEach(function (rid) { z.rohstoffe[rid] -= r.ladung[rid]; });
    z.flottenZaehler = (z.flottenZaehler || 0) + 1;
    var f = { id: "f" + z.flottenZaehler, herkunft: p.id, start: herkunftKoord(z, p), ziel: r.ziel, zielName: auftrag.zielName || (r.zielEigen ? r.zielEigen.name : ""),
      mission: r.mission.id, schiffe: r.schiffe, anzahl: r.anzahl, abflug: jetzt, ankunft: jetzt + r.dauer, rueckkehr: null, phase: "hin",
      ladung: Object.keys(r.ladung).length ? r.ladung : undefined, rohoel: r.rohoel };
    if (r.mission.id === "angriff" && SS.kern.bergung) SS.kern.bergung.schildAus(p, jetzt); // 0.20.0: kein Angriff aus der Schild-Deckung
    if (r.halten) { f.halten = r.halten; f.halteMs = SS.kern.werft.istMaster(z) ? 0 : r.halten * 3600000; }
    z.flotten.push(f);
    r.flotte = f;
    if (r.dauer === 0) r.meldungen = faellige(z, jetzt); // Master: Ankunft (und ggf. Rückkehr) sofort
    return r;
  }

  /** Fortschritt eines Fluges (aktuelle Phase). */
  function status(f, jetzt) {
    var von = f.phase === "hin" ? f.abflug : f.phase === "halten" ? f.ankunft : (f.haltEnde || f.ankunft), bis = f.phase === "hin" ? f.ankunft : f.phase === "halten" ? f.haltEnde : f.rueckkehr;
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
        if (f.mission === "expedition") { f.phase = "halten"; f.haltEnde = f.ankunft + (f.halteMs || 0); meld.push({ art: "flotte", name: m.name, text: "Expedition erreicht " + ziel + " – hält " + (f.halten || 1) + " h" }); }
        else if (f.mission === "kolonisieren" && !eigen && SS.kern.kolonie) { // 0.18.0 (Sandro t49u)
          var kr = SS.kern.kolonie.gruende(z, f);
          if (kr.planet) {
            z.flotten.splice(z.flotten.indexOf(f), 1);
            meld.push({ art: "flotte", name: m.name, text: "Kolonie „" + kr.planet.name + "“ gegründet auf " + ziel + " – Kolonieschiff verbraucht, " + summe(kr.schiffe) + " Schiffe stationiert" + (summe(kr.ladung) ? ", Ladung entladen (" + summe(kr.ladung) + ")" : "") });
            return;
          }
          f.phase = "rueck"; f.rueckkehr = f.ankunft + (f.ankunft - f.abflug); f.bericht = "Kolonisieren fehlgeschlagen: " + kr.fehler;
          meld.push({ art: "flotte", name: m.name, text: f.bericht + " – Flotte kehrt um" });
          return;
        }
        else if (f.mission === "stationieren" && eigen) {
          var zp = planetVonId(z, eigen.id);
          if (f.ladung) { Object.keys(f.ladung).forEach(function (rid) { z.rohstoffe[rid] = (z.rohstoffe[rid] || 0) + f.ladung[rid]; }); }
          Object.keys(f.schiffe).forEach(function (id) { zp.schiffe[id] = (zp.schiffe[id] || 0) + f.schiffe[id]; });
          z.flotten.splice(z.flotten.indexOf(f), 1);
          meld.push({ art: "flotte", name: m.name, text: "Flotte stationiert auf " + ziel });
          return;
        }
        else if ((f.mission === "sammeln" || f.mission === "bodensammlung") && eigen && SS.kern.bergung) { // 0.20.0 Bergung eigener Planet
          var gb = SS.kern.bergung.bergeEigen(z, f, planetVonId(z, eigen.id));
          f.phase = "rueck"; f.rueckkehr = f.ankunft + (f.ankunft - f.abflug);
          f.bericht = m.name + " bei " + ziel + ": geborgen " + gb.metall + " M / " + gb.silizium + " Si (Rest " + gb.rest.metall + " M / " + gb.rest.silizium + " Si)";
          meld.push({ art: "flotte", name: m.name, text: f.bericht });
        }
        if (f.mission !== "expedition" && f.phase === "hin") {
        // ANNAHME: Ohne Gegner/Kolonien (Weltraum-Kapitel) haben Missionen am Ziel noch keine Wirkung → Rückflug.
        // Transport (Sandro t30u, FEST): Ladung sofort entladen, Flotte kehrt sofort und automatisch zurück.
        // ANNAHME: Rohstoffe sind global (ein Lager je Spieler) → bei eigenem Ziel wieder gutgeschrieben; fremdes Ziel = abgeliefert.
        // 0.14.1 Testphase: Spionage/Angriff gegen Test-Gegner (z.gegner) wirken echt.
        var tp = !eigen && SS.kern.testphase ? SS.kern.testphase.ankunft(z, f, f.ankunft) : null;
        if (tp) {
          f.bericht = tp;
          meld.push({ art: "flotte", name: m.name, text: tp });
          if (!f.anzahl) { z.flotten.splice(z.flotten.indexOf(f), 1); meld.push({ art: "flotte", name: m.name, text: "Flotte bei " + ziel + " vollständig zerstört" }); return; }
          f.phase = "rueck"; f.rueckkehr = f.ankunft + (f.ankunft - f.abflug);
        }
        var entl = "";
        if (f.mission === "transportieren" && f.ladung) {
          if (eigen) Object.keys(f.ladung).forEach(function (rid) { z.rohstoffe[rid] = (z.rohstoffe[rid] || 0) + f.ladung[rid]; });
          entl = " – Ladung entladen (" + summe(f.ladung) + ")"; f.entladen = f.ladung; delete f.ladung;
        }
        if (!tp) { f.phase = "rueck"; f.rueckkehr = f.ankunft + (f.ankunft - f.abflug);
        f.bericht = m.name + " bei " + ziel + ": " + (f.mission === "transportieren" || f.mission === "unterstuetzen" ? "Ziel erreicht" + entl + (!eigen && SS.kern.testphase && SS.kern.testphase.gegnerAn(z, f.ziel) ? " (abgeliefert)" : "") : "kein Gegner/keine Wirkung (folgt im Weltraum-Kapitel)");
        meld.push({ art: "flotte", name: m.name, text: "Flotte erreicht " + ziel + " (" + m.name + ")" }); }
        }
      }
      if (f.phase === "halten" && jetzt >= f.haltEnde) {
        var ev = SS.kern.expedition.ereignis(z, f, f.haltEnde, z._expeditionZufall);
        f.ergebnis = ev; f.bericht = "Expedition " + ziel + ": " + ev.text;
        z.letzteExpeditionen = [{ zeit: f.haltEnde, ziel: f.ziel, halten: f.halten, art: ev.art, text: ev.text, master: SS.kern.werft.istMaster(z) }].concat(z.letzteExpeditionen || []).slice(0, 10);
        f.phase = "rueck"; f.rueckkehr = f.haltEnde + Math.round((f.ankunft - f.abflug) * (f.verzoegerung || 1));
        meld.push({ art: "flotte", name: m.name, text: f.bericht });
      }
      if (f.phase === "rueck" && jetzt >= f.rueckkehr) {
        var hp = planetVonId(z, f.herkunft) || z.planeten[0];
        Object.keys(f.schiffe).forEach(function (id) { hp.schiffe[id] = (hp.schiffe[id] || 0) + f.schiffe[id]; });
        if (f.ladung) Object.keys(f.ladung).forEach(function (rid) { z.rohstoffe[rid] = (z.rohstoffe[rid] || 0) + f.ladung[rid]; }); // 0.14.2: geborgene Trümmer
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
    pruefe: pruefe, ladekapazitaet: ladekapazitaet, hinUndZurueck: hinUndZurueck, senden: senden, status: status, faellige: faellige, favoritHinzu: favoritHinzu, favoritWeg: favoritWeg, summe: summe
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
