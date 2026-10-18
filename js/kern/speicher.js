/*
 * Sternenspiel – Speichern/Laden (localStorage).
 * Der Speicher wird hereingereicht (window.localStorage oder ein Test-Ersatz).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};

  function schluessel() { return SS.BALANCE.SPEICHER_SCHLUESSEL; }

  /** Speichert den Spielstand. Rechnet vorher die laufende Produktion bis „jetzt“ ab. */
  function speichere(speicher, zustand, jetzt) {
    SS.kern.produktion.tick(zustand, jetzt);
    zustand.zeit.zuletztGespeichert = jetzt;
    speicher.setItem(schluessel(), JSON.stringify(zustand));
    return true;
  }

  /**
   * Lädt den Spielstand. Rückgabe: { zustand, fehler }.
   * zustand ist null, wenn nichts gespeichert oder der Stand defekt ist.
   * Offline-Fortschritt wird NICHT hier, sondern über produktion.offlineFortschritt angewendet.
   */
  function lade(speicher) {
    var roh;
    try { roh = speicher.getItem(schluessel()); } catch (e) { return { zustand: null, fehler: "Speicher nicht verfügbar" }; }
    if (roh == null) return { zustand: null, fehler: null };
    var z;
    try { z = JSON.parse(roh); } catch (e) { return { zustand: null, fehler: "Spielstand ist beschädigt (kein gültiges JSON)" }; }
    if (!SS.kern.zustand.istGueltig(z)) return { zustand: null, fehler: "Spielstand ist beschädigt (Felder fehlen)" };
    try { z = SS.kern.zustand.migriere(z); } catch (e) { return { zustand: null, fehler: e.message }; }
    return { zustand: z, fehler: null };
  }

  function vorhanden(speicher) {
    try { return speicher.getItem(schluessel()) != null; } catch (e) { return false; }
  }

  function loesche(speicher) {
    speicher.removeItem(schluessel());
  }

  SS.kern.speicher = { speichere: speichere, lade: lade, vorhanden: vorhanden, loesche: loesche };
})(typeof globalThis !== "undefined" ? globalThis : this);
