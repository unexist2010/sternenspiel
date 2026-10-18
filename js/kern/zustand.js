/*
 * Sternenspiel – Spielstand (Datenmodell).
 * Der Spielstand ist ein reines JSON-Objekt (speicherbar in localStorage).
 * Felder für spätere Kapitel sind bereits angelegt (leer), damit Gebäude,
 * Forschung, Schiffe, Kampf und KI-Ereignisse ohne Formatbruch andocken können.
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

  /**
   * Erstellt einen neuen Spielstand.
   * @param {{name?:string, startplatz:string, jetzt:number}} opt
   */
  function neuerSpielstand(opt) {
    var sp = SS.DATEN.startplatzNachBuchstabe(opt && opt.startplatz);
    if (!sp) throw new Error("Unbekannter Startplatz: " + (opt && opt.startplatz));
    var jetzt = Number(opt.jetzt);
    if (!isFinite(jetzt)) throw new Error("Zeitpunkt fehlt");
    var name = String((opt.name || "").trim() || "Kommandant").slice(0, 24);
    return {
      version: SS.BALANCE.SPIELSTAND_VERSION,
      name: name,
      erstelltAm: jetzt,
      startplatz: { buchstabe: sp.buchstabe, stufe: sp.stufe, schwerpunkt: sp.schwerpunkt },
      rohstoffe: rohstoffMap(SS.BALANCE.STARTBESTAND),
      zeit: { letzterTick: jetzt, zuletztGespeichert: null },
      statistik: { produziertGesamt: rohstoffMap(null), offlineMsGesamt: 0 },

      // --- Andockpunkte für spätere Kapitel (in Kapitel 1 leer) ---
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

  /** Prüft grob, ob ein Objekt ein gültiger Spielstand ist. */
  function istGueltig(z) {
    if (!z || typeof z !== "object") return false;
    if (typeof z.version !== "number") return false;
    if (!z.startplatz || !SS.DATEN.startplatzNachBuchstabe(z.startplatz.buchstabe)) return false;
    if (!z.rohstoffe || typeof z.rohstoffe !== "object") return false;
    if (!z.zeit || !isFinite(z.zeit.letzterTick)) return false;
    return true;
  }

  /**
   * Ergänzt fehlende Felder (Vorwärtskompatibilität) und hebt ältere Versionen an.
   * Gibt den (veränderten) Spielstand zurück.
   */
  function migriere(z) {
    if (z.version > SS.BALANCE.SPIELSTAND_VERSION) {
      throw new Error("Spielstand stammt aus einer neueren Spielversion (" + z.version + ")");
    }
    // Stufe/Schwerpunkt immer aus den Daten übernehmen (Quelle der Wahrheit)
    var sp = SS.DATEN.startplatzNachBuchstabe(z.startplatz.buchstabe);
    z.startplatz = { buchstabe: sp.buchstabe, stufe: sp.stufe, schwerpunkt: sp.schwerpunkt };
    z.rohstoffe = rohstoffMap(z.rohstoffe);
    z.name = String(z.name || "Kommandant").slice(0, 24);
    z.statistik = z.statistik || {};
    z.statistik.produziertGesamt = rohstoffMap(z.statistik.produziertGesamt);
    z.statistik.offlineMsGesamt = Number(z.statistik.offlineMsGesamt) || 0;
    if (!("zuletztGespeichert" in z.zeit)) z.zeit.zuletztGespeichert = null;
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

  SS.kern.zustand = { neuerSpielstand: neuerSpielstand, istGueltig: istGueltig, migriere: migriere };
})(typeof globalThis !== "undefined" ? globalThis : this);
