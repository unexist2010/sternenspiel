/*
 * Sternenspiel – Speichern/Laden (localStorage).
 * Der Speicher wird hereingereicht (window.localStorage oder ein Test-Ersatz).
 * Jede Funktion nimmt optional einen Schlüssel – so hat jedes Spielerprofil seinen eigenen Spielstand.
 * Ohne Schlüssel wird der alte Einzel-Spielstand (bis Version 0.3) angesprochen.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};

  function schluessel(k) { return k || SS.BALANCE.SPEICHER_SCHLUESSEL; }

  /** Speichert den Spielstand. Rechnet vorher die laufende Produktion bis „jetzt“ ab. */
  function speichere(speicher, zustand, jetzt, k) {
    SS.kern.produktion.tick(zustand, jetzt);
    zustand.zeit.zuletztGespeichert = jetzt;
    speicher.setItem(schluessel(k), JSON.stringify(zustand));
    return true;
  }

  /**
   * Lädt einen Spielstand. Rückgabe: { zustand, fehler } – wirft NIE.
   * zustand ist null, wenn nichts gespeichert oder der Stand defekt ist.
   * Offline-Fortschritt wird NICHT hier, sondern über produktion.offlineFortschritt angewendet.
   */
  function lade(speicher, k) {
    var roh;
    try { roh = speicher.getItem(schluessel(k)); } catch (e) { return { zustand: null, fehler: "Speicher nicht verfügbar" }; }
    if (roh == null) return { zustand: null, fehler: null };
    var z;
    try { z = JSON.parse(roh); } catch (e) { return { zustand: null, fehler: "Spielstand ist beschädigt (kein gültiges JSON)" }; }
    if (!SS.kern.zustand.istGueltig(z)) return { zustand: null, fehler: "Spielstand ist beschädigt (Felder fehlen)" };
    try { z = SS.kern.zustand.migriere(z); } catch (e) { return { zustand: null, fehler: e.message || String(e) }; }
    return { zustand: z, fehler: null };
  }

  function vorhanden(speicher, k) {
    try { return speicher.getItem(schluessel(k)) != null; } catch (e) { return false; }
  }

  function loesche(speicher, k) {
    try { speicher.removeItem(schluessel(k)); } catch (e) { /* nichts zu tun */ }
  }

  SS.kern.speicher = { speichere: speichere, lade: lade, vorhanden: vorhanden, loesche: loesche };
})(typeof globalThis !== "undefined" ? globalThis : this);
