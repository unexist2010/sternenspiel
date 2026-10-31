/* Sternenspiel – dezente Missions-Symbole (0.21.2, Sandro pt63u). Inline-SVG, Farbe über currentColor. DOM-frei. */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {}); SS.ui = SS.ui || {};
  var P = {
    kolonisieren: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 3.5L17 11H6"/><path d="M3 21h8"/>',                         // Fahne
    transportieren: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',                 // Kiste
    stationieren: '<path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M4 20h16"/>',                                  // Landen/Ablegen
    spionieren: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',         // Auge
    angriff: '<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="M6 18l-3 3"/><path d="M8.5 12.5l3 3"/>',                // Schwert
    sammeln: '<path d="M12 4l7 4v8l-7 4-7-4V8z"/><path d="M9 11l3 3 3-3"/>',                                              // Wrack einsammeln
    bodensammlung: '<path d="M4 20h16"/><path d="M8 20l2-8h4l2 8"/><path d="M12 12V4"/><path d="M9 7l3-3 3 3"/>',        // Bodenschrott hoch
    expedition: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',                                    // Kompass
    unterstuetzen: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'                                              // Schild
  };
  var T = { kolonisieren: "Kolonisieren", transportieren: "Transport", stationieren: "Stationieren", spionieren: "Spionage", angriff: "Angriff",
    sammeln: "Wracksammlung", bodensammlung: "Bodensammlung", expedition: "Expedition", unterstuetzen: "Unterstützen" };
  function svg(id) {
    return '<svg class="sym" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[id] || '<circle cx="12" cy="12" r="4"/>') + '</svg>';
  }
  SS.ui.symbole = { svg: svg, text: function (id) { return T[id] || id; }, IDS: Object.keys(P) };
})(typeof window !== "undefined" ? window : globalThis);
