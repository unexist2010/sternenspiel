/*
 * Sternenspiel – Kampf-Rechenkern (Kapitel 5, erste Simulation). Kein Zufall: Erwartungswert-Simulation je Einheitengruppe.
 *
 * FEST (Sandro 2026-10-31):
 *  - Phase 1 ORBIT: Angreifer-Flotte gegen Verteidiger-Schiffe auf den Startplätzen + Orbitalverteidigungsplattformen.
 *  - Phase 2 BODEN: verbleibende Angreifer gegen die Bodenverteidigung.
 *  - Schiffe auf den Startplätzen starten bei Angriff automatisch; Schiffe im Hangar sind geschützt (werden nicht zerstört).
 *  - Nach dem Kampf rücken Hangar-Schiffe auf freie Startplätze nach (erst NACH dem Kampf) – für die nächste Welle.
 *  - Zwei Hüllen (Metall + Energie), gleichzeitig angreifbar; nach Zusammenbruch der Energiehülle Bonus für metallwirksame Waffen,
 *    reine Energiewaffen nahezu wirkungslos.
 *  - Trümmer: Orbit = Schiffe (Wracksammler); Boden = Verteidigung: Teil Reparatur (Forschung), Rest Schrott (Bodensammler), max 50 %.
 *  - Kampfbericht (Kapitel Kampfsystem, t31u): Rundenprotokoll je Gruppe (Start, Verluste, Hüllen, Schaden, Waffeneinsatz).
 * ANNAHME (alle Zahlen in SS.BALANCE.KAMPF):
 *  - Feuer verteilt sich proportional zur Anzahl der Ziele (Erwartungswert statt Würfeln); 6 Runden je Phase; Schaden gleichzeitig am Rundenende.
 *  - Energiehülle regeneriert nicht. FEST (t27u): Ziele ohne Energiehülle zählen wie „Hülle gebrochen“ (Bonus/Malus gilt).
 *  - Startplatz-Belegung: stärkste Kampfschiffe zuerst (Reihenfolge der Schiffsliste rückwärts), dann Hilfs-/Spezialschiffe;
 *    Solarsatelliten stehen immer im Orbit (zählen nicht auf Startplätze). Rest = Hangar.
 *  - Schildkuppel/Festungsschild: gemeinsamer Planetenschild, fängt Boden-Schaden (Energie + Metall) zuerst ab; aktiviert sich
 *    FEST (t27u): kein Cooldown – auch wenn er im Kampf fällt, ist er nach dem Angriff automatisch wieder aktiv (wird nie zerstört).
 *  - Orbitalplattform FEST (t27u): nach dem Angriff immer zu 100 % wieder da (wie OGame-Mond). Nur wenn ein sehr großes Schiff
 *    (BALANCE.KAMPF.PLATTFORM_ZERSTOERER, z. B. Titan) beim Angreifer den Kampf überlebt, gelten Verluste normal (Reparatur-Quote, Rest → Orbit-Trümmer).
 *  - 0.17.0 (Sandro t47u): Railgun ignoriert die Energiehülle (voller Metallschaden ×BONUS_NACH_ENERGIE, kein Energieschaden);
 *    EMP nur am Titan (siehe emp()); Metallhülle 0 = tot, egal wie viel Energie übrig. Balance: docs/BALANCE-WAFFEN.md.
 *  - Kein Schnellfeuer (gestrichen, Sandro 0.22.1).
 *  - FEST (Sandro t33u, 0.14.2) ZIVILSCHIFFE: alles mit gruppe !== "kampf" (Frachter, Wrack-/Bodensammler, Sonden, Kolonieschiff,
 *    Tanker, Solarsatelliten) kämpft NIE und ist kein Ziel („fliegt hinten in der Formation“). Keine Zivil-Verluste, solange die
 *    eigenen Kampfschiffe nicht alle vernichtet sind. Angreifer: 0 Kampfschiffe übrig → alle Zivilschiffe der Flotte vernichtet.
 *    Verteidiger (FEST Sandro t34u, 0.14.3): Zivilschiffe der Kampf-Flotte (= auf den Startplätzen, verteilung.startplatz) werden
 *    vernichtet, wenn nach Phase 1 keine Verteidiger-Orbit-Kampfeinheit mehr steht und der Angreifer noch Kampfschiffe hat.
 *    Zivil im Hangar (verteilung.hangar) wird NIE vernichtet. Solarsatelliten stehen im Orbit → wie Startplatz-Zivil vernichtet.
 *  - Spezialisierung „Bergung“ (Spec Salvage) = Option {bergung:true}; ein Klassen-System gibt es noch nicht.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; }, K = function () { return SS.BALANCE.KAMPF; };

  /** Startplatz-/Hangar-Verteilung der Schiffe eines Planeten. → { startplatz:{id:n}, hangar:{id:n}, kapazitaet, belegt } */
  /**
   * Kapitel 6: mit Spielstand z gilt das Flotten-Preset; die freien (nicht durch Flotten unterwegs belegten) Startplätze
   * verteidigen. Nur wenn ALLE Startplätze belegt sind, gibt es KEINE Verteidigungsflotte (Sandro t30u)
   * → Phase 1 nur Orbitalplattform, Phase 2 Boden.
   * Ohne z: alte Reihenfolge (stärkste Kampfschiffe zuerst).
   */
  function verteilung(p, z) {
    if (z && SS.kern.flotte) {
      var sb = SS.kern.flotte.startbahnen(z, p);
      var sat = {}, hgAll = {};
      if (!sb.verteidigt) Object.keys(p.schiffe || {}).forEach(function (id) { if (id !== "solarsatellit" && p.schiffe[id] > 0) hgAll[id] = p.schiffe[id]; });
      else Object.keys(sb.hangar).forEach(function (id) { if (id !== "solarsatellit") hgAll[id] = sb.hangar[id]; });
      return { startplatz: sb.verteidigt ? sb.startplatz : sat, hangar: hgAll, kapazitaet: sb.kapazitaet, belegt: sb.verteidigt ? sb.aufStartbahn : 0,
        unterwegs: sb.unterwegs, keineFlotte: !sb.verteidigt };
    }
    var kap = SS.kern.bau.kapazitaet(p), rest = kap, sp = {}, hg = {};
    var reihe = D().schiffe.filter(function (s) { return s.gruppe === "kampf"; }).reverse()
      .concat(D().schiffe.filter(function (s) { return s.gruppe !== "kampf" && s.id !== "solarsatellit"; }));
    reihe.forEach(function (s) {
      var n = (p.schiffe && p.schiffe[s.id]) || 0; if (!n) return;
      var a = Math.min(n, rest); rest -= a;
      if (a) sp[s.id] = a; if (n - a) hg[s.id] = n - a;
    });
    return { startplatz: sp, hangar: hg, kapazitaet: kap, belegt: kap - rest };
  }

  /** Kampfschiff/Verteidigung? Zivilschiffe (gruppe !== "kampf") kämpfen nie (t33u). */
  function istKampf(x) { if (x.art !== "schiff") return true; var d = D().schiffNachId(x.id); return !!d && d.gruppe === "kampf"; }
  function waffenProfil(waffen) {
    return Object.keys(waffen).map(function (w) { var wt = D().waffentypNachId(w); return { id: w, anteil: waffen[w], e: wt.profil.energie, m: wt.profil.metall, durch: !!wt.ignoriertEnergie }; });
  }
  function gruppe(art, def, n, w) {
    return { art: art, id: def.id, name: def.name, kosten: def.kosten, vorher: n, n: n, angriff: w.angriff, profil: waffenProfil(def.waffen),
      energieJe: w.energie, metallJe: w.metall, energie: w.energie * n, metall: w.metall * n, schutzschild: !!def.schutzschild, phase: def.phase || "orbit", emp: def.emp ? (w.empStufe || 0) : 0 };
  }
  function schiffGruppen(z, schiffe) {
    return Object.keys(schiffe || {}).filter(function (id) { return schiffe[id] > 0 && D().schiffNachId(id); }).map(function (id) {
      var s = D().schiffNachId(id), w = SS.kern.werft.werte(z, s); if (s.emp) w = Object.assign({}, w, { empStufe: stufe(z, "emp") });
      return gruppe("schiff", s, schiffe[id], w);
    });
  }
  function defGruppen(z, p, phase) {
    return D().verteidigung.filter(function (d) { return d.phase === phase && ((p.verteidigung && p.verteidigung[d.id]) || 0) > 0; }).map(function (d) {
      return gruppe("verteidigung", d, p.verteidigung[d.id], SS.kern.verteidigung.werte(z, d));
    });
  }

  /** Schaden einer Einheit mit Angriff a und Profil pr gegen Ziel t → {e, m}. */
  function schaden(a, pr, t) {
    var k = K(), kaputt = t.energie <= 1e-9 && (t.energieJe > 0 || k.BONUS_OHNE_ENERGIEHUELLE), e = 0, m = 0;
    pr.forEach(function (w) {
      if (w.durch) { m += a * w.anteil * w.m * k.BONUS_NACH_ENERGIE; return; } // 0.17.0 Railgun: ignoriert die Energiehülle (wie gebrochen)
      e += a * w.anteil * w.e;
      m += a * w.anteil * w.m * (kaputt ? (w.m >= k.BONUS_SCHWELLE ? k.BONUS_NACH_ENERGIE : k.MALUS_NACH_ENERGIE) : 1);
    });
    if (!(t.energieJe > 0)) e = 0;
    return { e: e, m: m };
  }

  /** Momentaufnahme einer Gruppe (für das Rundenprotokoll). */
  function snap(x) { return { art: x.art, id: x.id, name: x.name, n: x.n, energie: x.energie, metall: x.metall }; }
  function rund(v) { return Math.round(v * 10) / 10; }

  /**
   * Eine Phase: Seite A (Angreifer) gegen Seite B, optionaler Planetenschild auf Seite B. → Rundenprotokoll
   * Kampfbericht (t31u): je Runde und Gruppe Startanzahl + Verluste dieser Runde, Hüllenstände danach,
   * zugefügter Schaden (Energie/Metall) je Seite und aggregierter Waffeneinsatz (Schüsse + Schaden je Waffentyp).
   */
  /**
   * 0.17.0 EMP (Sandro t47u): jeder lebende Titan mit EMP-Stufe L setzt vor Runde 1 die Energiehülle von bis zu
   * EMP_ZIELE_JE_STUFE × L gegnerischen Einheiten auf 0 – nur Gruppen mit Energiehülle je Einheit ≤ EMP_GRENZE_JE_STUFE × L,
   * größte Energiehülle zuerst. Planetenschilde (schutzschild) sind immun. → Liste der Treffer fürs Protokoll.
   */
  function emp(von, ziele, seite) {
    var k = K(), out = [];
    von.forEach(function (x) {
      if (!(x.emp > 0) || !(x.n > 0)) return;
      var rest = x.n * k.EMP_ZIELE_JE_STUFE * x.emp, grenze = k.EMP_GRENZE_JE_STUFE * x.emp;
      ziele.filter(function (t) { return t.n > 0 && !t.schutzschild && t.energieJe > 0 && t.energieJe <= grenze && t.energie > 1e-9; })
        .sort(function (a, b) { return b.energieJe - a.energieJe; }).forEach(function (t) {
          if (rest <= 0) return;
          var anteil = Math.min(1, rest / t.n); rest -= Math.min(rest, t.n);
          out.push({ seite: seite, von: x.id, ziel: t.id, name: t.name, einheiten: Math.round(anteil * t.n), energieWeg: rund(t.energie * anteil) });
          t.energie *= 1 - anteil;
        });
    });
    return out;
  }

  function phase(A, B, schild) {
    var runden = [], R = K().RUNDEN_JE_PHASE;
    var empTreffer = emp(A, B, "angreifer").concat(emp(B, A, "verteidiger"));
    var lebt = function (l) { return l.filter(function (x) { return x.n > 0 && !x.schutzschild; }); };
    for (var r = 1; r <= R; r++) {
      var a = lebt(A), b = lebt(B);
      if (!a.length || !b.length) break;
      var vorA = a.map(snap), vorB = b.map(snap);
      var dmg = new Map(), zugefuegt = { angreifer: { e: 0, m: 0 }, verteidiger: { e: 0, m: 0 } }, waffen = { angreifer: {}, verteidiger: {} };
      var feuer = function (von, ziele, aufB) {
        var summe = ziele.reduce(function (s, t) { return s + t.n; }, 0), seite = aufB ? "angreifer" : "verteidiger";
        von.forEach(function (gq) {
          if (!(gq.angriff > 0) || !gq.profil.length) return;
          ziele.forEach(function (t) {
            var schuesse = gq.n * t.n / summe, s = schaden(gq.angriff, gq.profil, t), d = dmg.get(t) || { e: 0, m: 0, schild: aufB && schild };
            d.e += schuesse * s.e; d.m += schuesse * s.m; dmg.set(t, d);
            zugefuegt[seite].e += schuesse * s.e; zugefuegt[seite].m += schuesse * s.m;
            gq.profil.forEach(function (w) { // Waffeneinsatz: Anteil der Schüsse + Schaden je Waffentyp
              var ws = schaden(gq.angriff, [w], t), o = waffen[seite][w.id] || (waffen[seite][w.id] = { schuesse: 0, e: 0, m: 0 });
              o.schuesse += schuesse * w.anteil; o.e += schuesse * ws.e; o.m += schuesse * ws.m;
            });
          });
        });
      };
      feuer(a, b, true); feuer(b, a, false);
      var schildAbsorb = 0;
      dmg.forEach(function (d, t) {
        if (d.schild && schild.energie > 1e-9) { // Planetenschild fängt Schaden zuerst ab (Energie + Metall zusammen)
          var ges = d.e + d.m, ab = Math.min(schild.energie, ges), f = ges > 0 ? (ges - ab) / ges : 0;
          schild.energie -= ab; schildAbsorb += ab; d.e *= f; d.m *= f;
        }
        t.energie = Math.max(0, t.energie - d.e);
        t.metall = Math.max(0, t.metall - d.m);
        // FEST (Sandro t47u): Metallhülle 0 = Einheit zerstört, egal wie viel Energiehülle übrig ist
        t.n = t.metall <= 1e-6 ? 0 : Math.min(t.n, Math.ceil(t.metall / t.metallJe - 1e-9));
        t.energie = Math.min(t.energie, t.n * t.energieJe);
      });
      var gr = function (vor, liste) {
        return vor.map(function (v, i) {
          var x = liste[i];
          return { art: v.art, id: v.id, name: v.name, start: v.n, verloren: v.n - x.n, rest: x.n,
            energieVorher: rund(v.energie), metallVorher: rund(v.metall), energie: rund(x.energie), metall: rund(x.metall),
            energieMax: rund(v.n * x.energieJe), metallMax: rund(v.n * x.metallJe), energieGebrochen: x.energieJe > 0 && x.energie <= 1e-9 };
        });
      };
      var wl = function (o) { return Object.keys(o).map(function (id) { return { id: id, schuesse: rund(o[id].schuesse), e: rund(o[id].e), m: rund(o[id].m) }; }); };
      runden.push({ runde: r, angreifer: lebt(A).reduce(function (s, x) { return s + x.n; }, 0), verteidiger: lebt(B).reduce(function (s, x) { return s + x.n; }, 0),
        schildRest: schild ? schild.energie : null, schildAbsorb: schildAbsorb,
        gruppen: { angreifer: gr(vorA, a), verteidiger: gr(vorB, b) },
        schaden: { angreifer: { e: rund(zugefuegt.angreifer.e), m: rund(zugefuegt.angreifer.m) }, verteidiger: { e: rund(zugefuegt.verteidiger.e), m: rund(zugefuegt.verteidiger.m) } },
        waffen: { angreifer: wl(waffen.angreifer), verteidiger: wl(waffen.verteidiger) } });
    }
    runden.emp = empTreffer;
    return runden;
  }

  function verluste(l) { return l.map(function (x) { return { art: x.art, id: x.id, name: x.name, vorher: x.vorher, nachher: x.n, verloren: x.vorher - x.n }; }); }
  function wert(l, quote) {
    var r = { metall: 0, silizium: 0 };
    l.forEach(function (x) { r.metall += (x.kosten.metall || 0) * x.anzahl * quote; r.silizium += (x.kosten.silizium || 0) * x.anzahl * quote; });
    r.metall = Math.floor(r.metall); r.silizium = Math.floor(r.silizium); return r;
  }
  function stufe(z, id) { return SS.kern.forschung ? SS.kern.forschung.stufe(z, id) : 0; }

  /**
   * Simuliert einen Angriff auf Planet p (Spieler z). Ändert NICHTS am Zustand (siehe anwenden()).
   * @param opt { angreifer: {schiffId: n}, angreiferZustand?: z (Forschung des Angreifers; Standard: Forschung 0), bergung?: bool }
   */
  function simuliere(z, p, opt) {
    opt = opt || {};
    var k = K(), az = opt.angreiferZustand || { forschung: {} };
    var vt = verteilung(p, z);
    var alleA = schiffGruppen(az, opt.angreifer);
    var angreifer = alleA.filter(istKampf), zivilA = alleA.filter(function (x) { return !istKampf(x); });
    var alleV = schiffGruppen(z, vt.startplatz).concat(p.solarsatelliten > 0 ? [gruppe("schiff", D().schiffNachId("solarsatellit"), p.solarsatelliten, SS.kern.werft.werte(z, D().schiffNachId("solarsatellit")))] : []);
    var orbitV = alleV.filter(istKampf).concat(defGruppen(z, p, "orbit")), zivilV = alleV.filter(function (x) { return !istKampf(x); });
    var r1 = phase(angreifer, orbitV, null);
    var aKampfNach1 = angreifer.some(function (x) { return x.n > 0; });
    var orbitVerloren = aKampfNach1 && !orbitV.some(function (x) { return x.n > 0 && !x.schutzschild; });
    if (orbitVerloren) zivilV.forEach(function (x) { x.n = 0; }); // Verteidiger-Zivil im Orbit ungeschützt → vernichtet
    var boden = defGruppen(z, p, "boden");
    var schilde = boden.filter(function (x) { return x.schutzschild; });
    var schild = schilde.length ? { energie: schilde.reduce(function (s, x) { return s + x.energie; }, 0), start: 0 } : null;
    if (schild) schild.start = schild.energie;
    var restAngreifer = aKampfNach1;
    var r2 = restAngreifer ? phase(angreifer, boden, schild) : [];
    var aKampfRest = angreifer.some(function (x) { return x.n > 0; });
    if (!aKampfRest) zivilA.forEach(function (x) { x.n = 0; }); // Totalverlust → Zivilschiffe der Angriffsflotte vernichtet
    angreifer = angreifer.concat(zivilA); orbitV = orbitV.concat(zivilV);
    schilde.forEach(function (x) { x.n = x.vorher; }); // Planetenschild: kein Cooldown, nach dem Angriff automatisch wieder aktiv (t27u)
    var aV = verluste(angreifer), oV = verluste(orbitV), bV = verluste(boden);
    // Trümmer Orbit: alle zerstörten Schiffe beider Seiten + Rest der Orbitalplattformen
    var quoteO = opt.bergung ? k.TRUEMMER_ORBIT_BERGUNG : k.TRUEMMER_ORBIT;
    var repQ = Math.min(k.REPARATUR_MAX, k.REPARATUR_GRUND + k.REPARATUR_JE_STUFE * stufe(z, "panzerung"));
    var schrottQ = opt.bergung ? Math.min(k.SCHROTT_BERGUNG_MAX, k.SCHROTT_BERGUNG_GRUND + k.SCHROTT_JE_STUFE * stufe(z, "roboter"))
      : Math.min(k.SCHROTT_MAX, k.SCHROTT_GRUND + k.SCHROTT_JE_STUFE * stufe(z, "roboter"));
    var kostenVon = function (x) { return (x.art === "schiff" ? D().schiffNachId(x.id) : D().verteidigungNachId(x.id)).kosten; };
    var defVerl = oV.filter(function (x) { return x.art === "verteidigung"; }).concat(bV);
    var grossesSchiff = angreifer.some(function (x) { return x.n > 0 && (k.PLATTFORM_ZERSTOERER || []).indexOf(x.id) >= 0; });
    defVerl.forEach(function (x) {
      var q = x.id === "orbitalverteidigungsplattform" && !grossesSchiff ? 1 : repQ; // Plattform wie OGame-Mond
      x.repariert = Math.round(x.verloren * q); x.zerstoert = x.verloren - x.repariert;
    });
    var orbitTeile = aV.concat(oV.filter(function (x) { return x.art === "schiff"; })).map(function (x) { return { kosten: kostenVon(x), anzahl: x.verloren }; })
      .concat(oV.filter(function (x) { return x.art === "verteidigung"; }).map(function (x) { return { kosten: kostenVon(x), anzahl: x.zerstoert }; }));
    var truemmerOrbit = wert(orbitTeile, quoteO);
    var schrottBoden = wert(bV.map(function (x) { return { kosten: kostenVon(x), anzahl: x.zerstoert }; }), schrottQ);
    var angreiferRest = aV.filter(function (x) { return D().schiffNachId(x.id).gruppe === "kampf"; }).reduce(function (s, x) { return s + x.nachher; }, 0);
    var verteidigerRest = oV.concat(bV).filter(function (x) { var d = x.art === "schiff" ? D().schiffNachId(x.id) : D().verteidigungNachId(x.id); return !(d.schutzschild) && (x.art !== "schiff" || d.gruppe === "kampf"); })
      .reduce(function (s, x) { return s + x.nachher; }, 0);
    // Nachrücken (nach dem Kampf): verlorene Startplatz-Schiffe werden aus dem Hangar ersetzt
    var verlorenSP = oV.filter(function (x) { return x.art === "schiff" && x.id !== "solarsatellit"; }).reduce(function (s, x) { return s + x.verloren; }, 0);
    var hangarN = Object.keys(vt.hangar).reduce(function (s, id) { return s + vt.hangar[id]; }, 0);
    return {
      verteilung: vt, phasen: [{ id: "orbit", name: "Orbit", runden: r1, stattgefunden: true, nurOrbital: !!vt.keineFlotte, emp: r1.emp || [] }, { id: "boden", name: "Boden", runden: r2, stattgefunden: restAngreifer, emp: r2.emp || [] }],
      angreifer: aV, orbit: oV, boden: bV, schild: schild ? { start: schild.start, rest: schild.energie, gefallen: schild.energie <= 1e-9, wiederAktiv: true } : null, plattformZerstoerer: grossesSchiff,
      sieger: angreiferRest === 0 ? "verteidiger" : verteidigerRest === 0 ? "angreifer" : "unentschieden",
      truemmerOrbit: truemmerOrbit, schrottBoden: schrottBoden, quoten: { orbit: quoteO, reparatur: repQ, schrott: schrottQ },
      zivil: { angreifer: zivilA.map(snap), verteidiger: zivilV.map(snap), angreiferVernichtet: !aKampfRest && zivilA.length > 0, verteidigerVernichtet: orbitVerloren && zivilV.length > 0 },
      nachruecken: Math.min(verlorenSP, hangarN), live: { zufall: false, beute: false }
    };
  }

  /** Überträgt einen Bericht auf den Planeten: Verluste abziehen (Hangar bleibt), Reparatur, Trümmer/Schrott sammeln. */
  function anwenden(z, p, bericht) {
    bericht.orbit.forEach(function (x) {
      if (x.art === "schiff") {
        if (x.id === "solarsatellit") p.solarsatelliten = Math.max(0, (p.solarsatelliten || 0) - x.verloren);
        else if (p.schiffe[x.id]) { p.schiffe[x.id] = Math.max(0, p.schiffe[x.id] - x.verloren); if (!p.schiffe[x.id]) delete p.schiffe[x.id]; }
      } else p.verteidigung[x.id] = Math.max(0, (p.verteidigung[x.id] || 0) - x.zerstoert);
    });
    bericht.boden.forEach(function (x) { p.verteidigung[x.id] = Math.max(0, (p.verteidigung[x.id] || 0) - x.zerstoert); });
    p.truemmer = p.truemmer || { orbit: { metall: 0, silizium: 0 }, boden: { metall: 0, silizium: 0 } };
    ["metall", "silizium"].forEach(function (r) { p.truemmer.orbit[r] += bericht.truemmerOrbit[r]; p.truemmer.boden[r] += bericht.schrottBoden[r]; });
    return p;
  }

  SS.kern.kampf = { istKampf: istKampf, verteilung: verteilung, schaden: schaden, simuliere: simuliere, anwenden: anwenden };
})(typeof globalThis !== "undefined" ? globalThis : this);
