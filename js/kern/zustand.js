/*
 * Sternenspiel – Spielstand (Datenmodell).
 * Der Spielstand ist ein reines JSON-Objekt (speicherbar in localStorage).
 * Felder für spätere Kapitel sind bereits angelegt (leer), damit Anlagen, Forschung,
 * Schiffe, Startplätze/Flotten, Kampf und KI-Ereignisse ohne Formatbruch andocken können.
 *
 * Versionen: v1 Startplatz-Wahl A–Z · v2 + Heimatplanet/Freischaltungen ·
 *            v3 automatischer Start auf einem Hauptplaneten, Startplätze = Flotten-Startplattformen (A–J) ·
 *            v4 Kapitel 2: planeten[] mit Gebäuden, Bauauftrag, Reglern, Solarsatelliten, Rohölfeldern und Startplätzen ·
 *            v5 (0.7.0): Rohölvorkommen + Geologie-Log statt Rohölfeldern, Startplätze A–Z (Stufe ≤ 10), Master-Modus,
 *               Sperr-Flags Kunststoffwerk T2/T3, Hangar (vorbereitet) ·
 *            v6 (0.8.0): T2/T3-Freischaltung über Punkte, keine Gebäude-Obergrenze, Forschung (Stufen + Forschungsauftrag)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};

  function rohstoffMap(quelle) {
    var m = {};
    SS.DATEN.rohstoffIds.forEach(function (id) { m[id] = Number(quelle && quelle[id]) || 0; });
    return m;
  }

  function neueForschung(alt) {
    var f = {};
    SS.DATEN.forschungIds.forEach(function (id) { f[id] = Math.max(0, Math.floor(Number(alt && alt[id]) || 0)); });
    return f;
  }
  function forschungsauftragBereinigen(a) {
    return a && typeof a === "object" && SS.DATEN.forschungNachId(a.id) && isFinite(a.start) && isFinite(a.ende) && isFinite(a.stufe) && a.kosten && typeof a.kosten === "object" ? a : null;
  }

  /** Hauptplanet auf zufälliger Koordinate (ANNAHME). */
  function hauptplanet(wunschname, zufallFn) {
    var W = SS.DATEN.weltraum;
    var k = W.zufaelligeKoordinate(zufallFn);
    var name = String(wunschname || "").trim().slice(0, 24) || W.planet(k.system, k.planet).name;
    return { sektor: k.sektor, system: k.system, planet: k.planet, name: name };
  }

  /** Planet-Datensatz. Rohölvorkommen: Hauptplanet 1.000.000, andere Planeten 0 (FEST, 0.7.0). */
  function neuerPlanet(istHauptplanet) {
    var geb = {}, regler = { solarsatellit: 100 }, G = SS.BALANCE.GEOLOGIE;
    SS.DATEN.gebaeude.forEach(function (d) { geb[d.id] = 0; if (d.regler) regler[d.id] = 100; });
    return {
      id: istHauptplanet ? "hp" : "p" + Date.now(),
      istHauptplanet: !!istHauptplanet,
      rohoelVorkommen: istHauptplanet ? G.START_VORKOMMEN_HAUPTPLANET : G.START_VORKOMMEN_ANDERE, // bekanntes Rohöl (Bohrstation fördert daraus)
      geologie: SS.kern.geologie.neu(), // { naechsterFund, funde: [{zeit, stufe, menge}], zufall }
      hangar: { schiffe: {} },    // VORBEREITET (Flotten-Kapitel): Schiffe, die nicht auf die Startplätze passen – sicher bei Angriffen
      gebaeude: geb,
      regler: regler,             // Produktionsregler 0–100 % (Schritte à 10)
      solarsatelliten: 0,         // Bau später in der Werft
      bauauftrag: null,           // ein Auftrag gleichzeitig (OGame)
      startplaetze: SS.DATEN.startplaetzeAnfang()
    };
  }

  function planetBereinigen(p, istHaupt) {
    var neu = neuerPlanet(istHaupt);
    if (!p || typeof p !== "object") return neu;
    neu.id = typeof p.id === "string" ? p.id : neu.id;
    if (isFinite(Number(p.rohoelVorkommen)) && p.rohoelVorkommen != null) neu.rohoelVorkommen = Math.max(0, Number(p.rohoelVorkommen));
    var geo = p.geologie;
    if (geo && typeof geo === "object") {
      neu.geologie.naechsterFund = isFinite(Number(geo.naechsterFund)) && geo.naechsterFund != null ? Number(geo.naechsterFund) : null;
      neu.geologie.funde = (Array.isArray(geo.funde) ? geo.funde : []).filter(function (f) { return f && isFinite(f.zeit) && isFinite(f.menge); })
        .slice(-SS.BALANCE.GEOLOGIE.LOG_MAX);
      if (isFinite(Number(geo.zufall)) && geo.zufall != null) neu.geologie.zufall = Number(geo.zufall) >>> 0;
    }
    if (p.hangar && typeof p.hangar === "object" && p.hangar.schiffe && typeof p.hangar.schiffe === "object") neu.hangar = { schiffe: p.hangar.schiffe };
    SS.DATEN.gebaeude.forEach(function (d) {
      var st = Math.floor(Number(p.gebaeude && p.gebaeude[d.id]) || 0);
      neu.gebaeude[d.id] = Math.max(0, Math.min(SS.DATEN.maxStufe(d), st));
    });
    Object.keys(neu.regler).forEach(function (k) {
      var v = Number(p.regler && p.regler[k]);
      if (isFinite(v)) neu.regler[k] = Math.max(0, Math.min(100, Math.round(v / 10) * 10));
    });
    neu.solarsatelliten = Math.max(0, Math.floor(Number(p.solarsatelliten) || 0));
    var K = SS.BALANCE.STARTPLAETZE;
    neu.startplaetze = neu.startplaetze.map(function (sp) {
      var alt = (Array.isArray(p.startplaetze) ? p.startplaetze : []).filter(function (x) { return x && x.buchstabe === sp.buchstabe; })[0];
      return { buchstabe: sp.buchstabe, stufe: alt ? Math.max(0, Math.min(K.STUFE_MAX, Math.floor(Number(alt.stufe) || 0))) : 0 };
    });
    var a = p.bauauftrag;
    if (a && isFinite(a.start) && isFinite(a.ende) && a.kosten && (a.art === "gebaeude" ? SS.DATEN.gebaeudeNachId(a.id) : SS.DATEN.startplatzBuchstaben.indexOf(a.buchstabe) >= 0)) neu.bauauftrag = a;
    return neu;
  }

  /**
   * Erstellt einen neuen Spielstand – ohne jede Auswahl, direkt auf einem Hauptplaneten.
   * @param {{name?:string, planetName?:string, jetzt:number, zufall?:function():number}} opt
   */
  function neuerSpielstand(opt) {
    opt = opt || {};
    var jetzt = Number(opt.jetzt);
    if (!isFinite(jetzt)) throw new Error("Zeitpunkt fehlt");
    var name = String((opt.name || "").trim() || "Kommandant").slice(0, 24);
    return {
      version: SS.BALANCE.SPIELSTAND_VERSION,
      name: name,
      erstelltAm: jetzt,
      heimat: hauptplanet(opt.planetName, opt.zufall), // Hauptplanet: Sektor:System:Planet
      // Kapitel 2: Kunststoff T1–T3 sichtbar (wird produziert); Antimaterie bleibt ausgeblendet (FEST)
      // 0.7.0: Kunststoffwerk T2/T3 gesperrt – Freischaltbedingung folgt später (offene Frage); Master ignoriert die Sperre
      freigeschaltet: { kunststoff_t1: true, kunststoff_t2: true, kunststoff_t3: true, antimaterie: false, kunststoffwerk_t2: false, kunststoffwerk_t3: false },
      rohstoffe: rohstoffMap(SS.BALANCE.STARTBESTAND),
      zeit: { letzterTick: jetzt, zuletztGespeichert: null },
      statistik: { produziertGesamt: rohstoffMap(null), offlineMsGesamt: 0 },

      punkte: 0,             // 1 Punkt je 1000 verbaute Rohstoffe (gewichtet, ANNAHME) – schaltet Startplätze frei
      planeten: [neuerPlanet(true)], // Kapitel 2: [0] = Hauptplanet (Koordinaten/Name in „heimat“)

      // --- Andockpunkte für spätere Kapitel (ohne Logik) ---
      forschung: neueForschung(),   // Kapitel 3: Stufe je Forschung
      forschungsauftrag: null,      // Kapitel 3: ein Forschungsauftrag gleichzeitig (OGame) – unabhängig vom Bauauftrag
      schiffe: {},           // späteres Kapitel: Bestand je Schiffstyp
      flotten: [],           // späteres Kapitel
      truemmerfelder: [],    // späteres Kapitel
      ereignisse: [],        // späteres Kapitel: KI-Angriffe/Ereignisse
      einstellungen: { schildAutoaktivierung: true, master: false } // Schild: Solo-Regel (Wirkung später) · master: Testmodus je Profil
    };
  }

  /** Prüft grob, ob ein Objekt ein ladbarer Spielstand ist (auch ältere Versionen). */
  function istGueltig(z) {
    if (!z || typeof z !== "object") return false;
    if (typeof z.version !== "number") return false;
    if (!z.rohstoffe || typeof z.rohstoffe !== "object") return false;
    if (!z.zeit || !isFinite(z.zeit.letzterTick)) return false;
    return true;
  }

  /**
   * Ergänzt fehlende Felder und hebt ältere Versionen an. Gibt den (veränderten) Spielstand zurück.
   * v1/v2 → v3: Heimat behalten (falls gültig), alte Startplatz-Wahl verwerfen. v≤3 → v4: Planet mit Gebäuden anlegen (siehe unten).
   * @param {function():number} [zufallFn] nur für Stände ohne gültige Heimat (v1)
   */
  function migriere(z, zufallFn) {
    if (z.version > SS.BALANCE.SPIELSTAND_VERSION) {
      throw new Error("Spielstand stammt aus einer neueren Spielversion (" + z.version + ")");
    }
    var W = SS.DATEN.weltraum;
    delete z.startplatz; // alte Startplatz-Wahl A–Z (v1/v2) – gibt es nicht mehr
    z.rohstoffe = rohstoffMap(z.rohstoffe);
    z.name = String(z.name || "Kommandant").slice(0, 24);
    var hk = z.heimat && W.leseKoordinaten(z.heimat.sektor + ":" + z.heimat.system + ":" + z.heimat.planet);
    if (!hk) z.heimat = hauptplanet(z.heimat && z.heimat.name, zufallFn);
    else z.heimat = { sektor: hk.sektor, system: hk.system, planet: hk.planet, name: String(z.heimat.name || W.planet(hk.system, hk.planet).name).slice(0, 24) };
    var vorher = z.version;
    z.freigeschaltet = z.freigeschaltet || {};
    ["kunststoff_t1", "kunststoff_t2", "kunststoff_t3"].forEach(function (k) { z.freigeschaltet[k] = vorher < 4 ? true : z.freigeschaltet[k] !== false; });
    z.freigeschaltet.antimaterie = z.freigeschaltet.antimaterie === true;
    ["kunststoffwerk_t2", "kunststoffwerk_t3"].forEach(function (k) { z.freigeschaltet[k] = z.freigeschaltet[k] === true; }); // v<5: gesperrt; v6: über Punkte (unten)
    z.statistik = z.statistik || {};
    z.statistik.produziertGesamt = rohstoffMap(z.statistik.produziertGesamt);
    z.statistik.offlineMsGesamt = Number(z.statistik.offlineMsGesamt) || 0;
    if (!("zuletztGespeichert" in z.zeit)) z.zeit.zuletztGespeichert = null;
    // v≤3 → v4: Planet-Datensatz anlegen. Alte Startplätze (A Stufe 1 ohne Kosten, ANNAHME aus v3) werden verworfen,
    // Strom wird Bilanz (Bestand 0), Lagergrenzen entfallen (Bestände bleiben unverändert).
    if (vorher < 4) {
      z.planeten = [neuerPlanet(true)];
      z.rohstoffe.strom = 0;
    }
    z.planeten = (Array.isArray(z.planeten) && z.planeten.length ? z.planeten : [null]).map(function (p, i) { return planetBereinigen(p, i === 0); });
    // v4 → v5: Rohölfelder entfallen (Hauptplanet bekommt 1.000.000 Vorkommen über planetBereinigen); vorhandene
    // Geologiestation startet ihren 24-h-Takt ab dem letzten Tick; Startplätze über Stufe 10 werden auf 10 gekappt.
    if (vorher < 5) z.planeten.forEach(function (p) {
      if (p.gebaeude.geologiestation > 0 && p.geologie.naechsterFund == null) SS.kern.geologie.gebaut(p, z.zeit.letzterTick);
    });
    delete z.startplaetze; delete z.gebaeude; delete z.lagerstaetten;
    z.punkte = Math.max(0, Number(z.punkte) || 0);
    SS.kern.bau.freischaltungenPruefen(z); // v6: Kunststoffwerk T2/T3 ab Punkteschwelle frei
    z.forschung = neueForschung(z.forschung);             // v6: alle Forschungen mit Stufe (unbekannte Einträge entfallen)
    z.forschungsauftrag = forschungsauftragBereinigen(z.forschungsauftrag);
    z.schiffe = z.schiffe || {};
    z.flotten = Array.isArray(z.flotten) ? z.flotten : [];
    z.truemmerfelder = Array.isArray(z.truemmerfelder) ? z.truemmerfelder : [];
    z.ereignisse = Array.isArray(z.ereignisse) ? z.ereignisse : [];
    z.einstellungen = z.einstellungen || {};
    if (typeof z.einstellungen.schildAutoaktivierung !== "boolean") z.einstellungen.schildAutoaktivierung = true;
    z.einstellungen.master = z.einstellungen.master === true;
    z.version = SS.BALANCE.SPIELSTAND_VERSION;
    return z;
  }

  SS.kern.zustand = { hauptplanet: hauptplanet, neuerPlanet: neuerPlanet, neuerSpielstand: neuerSpielstand, istGueltig: istGueltig, migriere: migriere };
})(typeof globalThis !== "undefined" ? globalThis : this);
