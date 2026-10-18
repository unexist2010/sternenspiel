/*
 * Sternenspiel – Spielstand (Datenmodell).
 * Der Spielstand ist ein reines JSON-Objekt (speicherbar in localStorage).
 * Felder für spätere Kapitel sind bereits angelegt (leer), damit Anlagen, Forschung,
 * Schiffe, Startplätze/Flotten, Kampf und KI-Ereignisse ohne Formatbruch andocken können.
 *
 * Versionen: v1 Startplatz-Wahl A–Z · v2 + Heimatplanet/Freischaltungen ·
 *            v3 automatischer Start auf einem Hauptplaneten, Startplätze = Flotten-Startplattformen (A–J)
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
      freigeschaltet: { antimaterie: false },          // FEST: Antimaterie versteckt bis zur Freischaltung
      rohstoffe: rohstoffMap(SS.BALANCE.STARTBESTAND),
      zeit: { letzterTick: jetzt, zuletztGespeichert: null },
      statistik: { produziertGesamt: rohstoffMap(null), offlineMsGesamt: 0 },

      // --- Andockpunkte für spätere Kapitel (in Kapitel 1 ohne Logik) ---
      startplaetze: SS.DATEN.startplaetzeAnfang(), // Kapitel 6: Flotten-Startplattformen A–J (ANNAHME: A Stufe 1 frei)
      punkte: 0,             // Kapitel 6/7: Grundlage für die Freischaltung weiterer Startplätze
      gebaeude: {},          // Kapitel 2: { geologiestation: { stufe: 0 }, … }
      lagerstaetten: null,   // Kapitel 2: Ergebnis der Geologiestation
      forschung: {},         // Kapitel 3
      schiffe: {},           // Kapitel 4: Bestand je Schiffstyp
      flotten: [],           // Kapitel 6
      truemmerfelder: [],    // Kapitel 5
      ereignisse: [],        // Kapitel 7: KI-Angriffe/Ereignisse
      einstellungen: { schildAutoaktivierung: true } // Solo-Regel (Wirkung ab Kapitel 5)
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

  function startplaetzeBereinigen(liste) {
    var K = SS.BALANCE.STARTPLAETZE;
    var anfang = SS.DATEN.startplaetzeAnfang();
    if (!Array.isArray(liste)) return anfang;
    return anfang.map(function (sp) {
      var alt = null;
      for (var i = 0; i < liste.length; i++) if (liste[i] && liste[i].buchstabe === sp.buchstabe) alt = liste[i];
      if (!alt) return sp;
      var frei = alt.freigeschaltet === true;
      var stufe = Math.floor(Number(alt.stufe) || 0);
      stufe = frei ? Math.min(K.STUFE_MAX, Math.max(K.STUFE_MIN, stufe)) : 0;
      return { buchstabe: sp.buchstabe, stufe: stufe, freigeschaltet: frei };
    });
  }

  /**
   * Ergänzt fehlende Felder und hebt ältere Versionen an. Gibt den (veränderten) Spielstand zurück.
   * v1/v2 → v3: Heimat behalten (falls gültig), alte Startplatz-Wahl (Feld „startplatz“ mit Stufe/Schwerpunkt) verwerfen.
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
    z.freigeschaltet = z.freigeschaltet || {};
    z.freigeschaltet.antimaterie = z.freigeschaltet.antimaterie === true;
    z.statistik = z.statistik || {};
    z.statistik.produziertGesamt = rohstoffMap(z.statistik.produziertGesamt);
    z.statistik.offlineMsGesamt = Number(z.statistik.offlineMsGesamt) || 0;
    if (!("zuletztGespeichert" in z.zeit)) z.zeit.zuletztGespeichert = null;
    z.startplaetze = startplaetzeBereinigen(z.startplaetze);
    z.punkte = Number(z.punkte) || 0;
    z.gebaeude = z.gebaeude || {};
    if (!("lagerstaetten" in z)) z.lagerstaetten = null;
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

  SS.kern.zustand = { hauptplanet: hauptplanet, neuerSpielstand: neuerSpielstand, istGueltig: istGueltig, migriere: migriere };
})(typeof globalThis !== "undefined" ? globalThis : this);
