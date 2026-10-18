/*
 * Sternenspiel – Spielstand (Datenmodell).
 * Der Spielstand ist ein reines JSON-Objekt (speicherbar in localStorage).
 * Felder für spätere Kapitel sind bereits angelegt (leer), damit Anlagen, Forschung,
 * Schiffe, Startplätze/Flotten, Kampf und KI-Ereignisse ohne Formatbruch andocken können.
 *
 * Versionen: v1 Startplatz-Wahl A–Z · v2 + Heimatplanet/Freischaltungen ·
 *            v3 automatischer Start auf einem Hauptplaneten, Startplätze = Flotten-Startplattformen (A–J) ·
 *            v4 Kapitel 2: planeten[] mit Gebäuden, Bauauftrag, Reglern, Solarsatelliten, Rohölfeldern und Startplätzen
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

  /** Hauptplanet auf zufälliger Koordinate (ANNAHME). */
  function hauptplanet(wunschname, zufallFn) {
    var W = SS.DATEN.weltraum;
    var k = W.zufaelligeKoordinate(zufallFn);
    var name = String(wunschname || "").trim().slice(0, 24) || W.planet(k.system, k.planet).name;
    return { sektor: k.sektor, system: k.system, planet: k.planet, name: name };
  }

  /** Planet-Datensatz (Kapitel 2). planet.istHauptplanet / planet.rohoelfelder: Regel für die Bohrstation (FEST). */
  function neuerPlanet(istHauptplanet) {
    var geb = {}, regler = { solarsatellit: 100 };
    SS.DATEN.gebaeude.forEach(function (d) { geb[d.id] = 0; if (d.regler) regler[d.id] = 100; });
    return {
      id: istHauptplanet ? "hp" : "p" + Date.now(),
      istHauptplanet: !!istHauptplanet,
      rohoelfelder: 0,            // von der Geologiestation gefunden (Kommazahl, angezeigt abgerundet)
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
    neu.rohoelfelder = Math.max(0, Number(p.rohoelfelder) || 0);
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
      freigeschaltet: { kunststoff_t1: true, kunststoff_t2: true, kunststoff_t3: true, antimaterie: false },
      rohstoffe: rohstoffMap(SS.BALANCE.STARTBESTAND),
      zeit: { letzterTick: jetzt, zuletztGespeichert: null },
      statistik: { produziertGesamt: rohstoffMap(null), offlineMsGesamt: 0 },

      punkte: 0,             // 1 Punkt je 1000 verbaute Rohstoffe (gewichtet, ANNAHME) – schaltet Startplätze frei
      planeten: [neuerPlanet(true)], // Kapitel 2: [0] = Hauptplanet (Koordinaten/Name in „heimat“)

      // --- Andockpunkte für spätere Kapitel (ohne Logik) ---
      forschung: {},         // späteres Kapitel
      schiffe: {},           // späteres Kapitel: Bestand je Schiffstyp
      flotten: [],           // späteres Kapitel
      truemmerfelder: [],    // späteres Kapitel
      ereignisse: [],        // späteres Kapitel: KI-Angriffe/Ereignisse
      einstellungen: { schildAutoaktivierung: true } // Solo-Regel (Wirkung später)
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
    delete z.startplaetze; delete z.gebaeude; delete z.lagerstaetten;
    z.punkte = Math.max(0, Number(z.punkte) || 0);
    z.forschung = z.forschung || {};
    z.schiffe = z.schiffe || {};
    z.flotten = Array.isArray(z.flotten) ? z.flotten : [];
    z.truemmerfelder = Array.isArray(z.truemmerfelder) ? z.truemmerfelder : [];
    z.ereignisse = Array.isArray(z.ereignisse) ? z.ereignisse : [];
    z.einstellungen = z.einstellungen || {};
    if (typeof z.einstellungen.schildAutoaktivierung !== "boolean") z.einstellungen.schildAutoaktivierung = true;
    z.version = SS.BALANCE.SPIELSTAND_VERSION;
    return z;
  }

  SS.kern.zustand = { hauptplanet: hauptplanet, neuerPlanet: neuerPlanet, neuerSpielstand: neuerSpielstand, istGueltig: istGueltig, migriere: migriere };
})(typeof globalThis !== "undefined" ? globalThis : this);
