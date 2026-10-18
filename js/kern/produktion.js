/*
 * Sternenspiel – Produktion, Ticks und Offline-Fortschritt.
 * Reine Logik ohne DOM → in Node testbar (tests/).
 *
 * Produktion = Grundrate aus konstanten.js (keine Startplatz-Boni mehr; Gebäude ab Kapitel 2).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var MS_PRO_STUNDE = 3600000;

  /** Lagerkapazität je Rohstoff (Kapitel 2: + Lager-Gebäude). */
  function lagerKapazitaet(zustand, rohstoffId) {
    return SS.BALANCE.LAGER_GRUND[rohstoffId] || 0;
  }

  /** Produktion pro Stunde je Rohstoff (Kapitel 2+: Gebäude-Anteile hier addieren). */
  function produktionProStunde(zustand) {
    var res = {};
    SS.DATEN.rohstoffIds.forEach(function (id) {
      var grund = SS.BALANCE.GRUNDPRODUKTION_PRO_STUNDE[id] || 0;
      res[id] = grund; // Kapitel 2+: Anteile von Anlagen addieren
    });
    return res;
  }

  /**
   * Wendet eine Zeitspanne Produktion auf den Spielstand an (Lager-gekappt).
   * Gibt die tatsächlich gewonnenen Mengen zurück.
   */
  function wendeZeitAn(zustand, ms) {
    var gewinne = {};
    var prod = produktionProStunde(zustand);
    ms = Math.max(0, Number(ms) || 0);
    SS.DATEN.rohstoffIds.forEach(function (id) {
      var vorher = zustand.rohstoffe[id] || 0;
      var kap = lagerKapazitaet(zustand, id);
      var neu = vorher + prod[id] * ms / MS_PRO_STUNDE;
      if (neu > kap) neu = Math.max(vorher, kap); // Überbestand (z. B. Beute) bleibt erhalten, wächst aber nicht
      gewinne[id] = neu - vorher;
      zustand.rohstoffe[id] = neu;
      zustand.statistik.produziertGesamt[id] += gewinne[id];
    });
    return gewinne;
  }

  /** Ein Echtzeit-Tick: rechnet die seit dem letzten Tick vergangene Zeit ab. */
  function tick(zustand, jetzt) {
    var delta = jetzt - zustand.zeit.letzterTick;
    if (!(delta > 0)) { // Uhr zurückgestellt o. Ä.: nichts gutschreiben, Referenz neu setzen
      zustand.zeit.letzterTick = jetzt;
      return { ms: 0, gewinne: wendeZeitAn(zustand, 0) };
    }
    var max = SS.BALANCE.OFFLINE_MAX_STUNDEN * MS_PRO_STUNDE;
    var ms = Math.min(delta, max);
    var gewinne = wendeZeitAn(zustand, ms);
    zustand.zeit.letzterTick = jetzt;
    return { ms: ms, gewinne: gewinne };
  }

  /**
   * Offline-Fortschritt seit dem letzten Speichern/Tick (beim Laden).
   * Gekappt auf OFFLINE_MAX_STUNDEN.
   */
  function offlineFortschritt(zustand, jetzt) {
    var abwesend = Math.max(0, jetzt - zustand.zeit.letzterTick);
    var max = SS.BALANCE.OFFLINE_MAX_STUNDEN * MS_PRO_STUNDE;
    var r = tick(zustand, jetzt);
    zustand.statistik.offlineMsGesamt += r.ms;
    return { abwesendMs: abwesend, angerechnetMs: r.ms, gekappt: abwesend > max, gewinne: r.gewinne };
  }

  SS.kern.produktion = {
    MS_PRO_STUNDE: MS_PRO_STUNDE,
    lagerKapazitaet: lagerKapazitaet,
    produktionProStunde: produktionProStunde,
    wendeZeitAn: wendeZeitAn,
    tick: tick,
    offlineFortschritt: offlineFortschritt
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
