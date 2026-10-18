/*
 * Sternenspiel – Spielerprofile (FEST, Sandros Wunsch).
 * Mehrere Spieler pro Browser; jeder hat seinen EIGENEN Spielstand in localStorage:
 *   sternenspiel_profile_v1          → Profil-Index { version, profile: [ {id, name, planet, koordinaten, erstelltAm, zuletztGespielt} ] }
 *   sternenspiel_spielstand_p_<id>   → Spielstand des Profils (Format wie bisher, v3)
 * Ein alter Einzel-Spielstand (Schlüssel sternenspiel_spielstand_v1, v1/v2/v3) wird automatisch als erstes Profil übernommen.
 * Alle Funktionen werfen NIE wegen kaputter Daten – Fehler kommen als Text zurück, damit der Start nie blockiert.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var B = SS.BALANCE;
  var INDEX_VERSION = 1;

  function spielstandSchluessel(id) { return B.PROFIL_SPIELSTAND_PRAEFIX + id; }

  function neueId(jetzt, zufallFn) {
    var r = zufallFn || Math.random;
    return Number(jetzt).toString(36) + Math.floor(r() * 1e9).toString(36);
  }

  function leererIndex() { return { version: INDEX_VERSION, profile: [] }; }

  /** Liest den Profil-Index. Rückgabe { index, fehler } (kaputter Index → leer + Fehlertext, alter Inhalt bleibt als Sicherung). */
  function ladeIndex(speicher) {
    var roh;
    try { roh = speicher.getItem(B.PROFIL_INDEX_SCHLUESSEL); } catch (e) { return { index: leererIndex(), fehler: "Speicher nicht verfügbar" }; }
    if (roh == null) return { index: leererIndex(), fehler: null };
    try {
      var idx = JSON.parse(roh);
      if (!idx || !Array.isArray(idx.profile)) throw new Error("Format");
      idx.profile = idx.profile.filter(function (p) { return p && typeof p.id === "string" && p.id; }).map(function (p) {
        return { id: p.id, name: String(p.name || "Spieler").slice(0, 24), planet: String(p.planet || "").slice(0, 24), koordinaten: String(p.koordinaten || ""),
          erstelltAm: Number(p.erstelltAm) || 0, zuletztGespielt: Number(p.zuletztGespielt) || 0 };
      });
      idx.version = INDEX_VERSION;
      return { index: idx, fehler: null };
    } catch (e) {
      try { speicher.setItem(B.PROFIL_INDEX_SCHLUESSEL + "_defekt_" + Date.now(), roh); } catch (e2) { /* egal */ }
      return { index: leererIndex(), fehler: "Spielerliste war beschädigt und wurde zurückgesetzt (Sicherung angelegt)." };
    }
  }

  function schreibeIndex(speicher, idx) { speicher.setItem(B.PROFIL_INDEX_SCHLUESSEL, JSON.stringify(idx)); }

  function meta(id, z, jetzt, alt) {
    return {
      id: id, name: z.name, planet: z.heimat.name, koordinaten: SS.DATEN.weltraum.koordinatenText(z.heimat),
      erstelltAm: (alt && alt.erstelltAm) || z.erstelltAm || jetzt, zuletztGespielt: jetzt
    };
  }

  function nameVergeben(idx, name, ausserId) {
    var n = String(name).trim().toLowerCase();
    return idx.profile.some(function (p) { return p.id !== ausserId && p.name.trim().toLowerCase() === n; });
  }

  /**
   * Übernimmt einen alten Einzel-Spielstand als Profil (einmalig). Rückgabe { profil, fehler }.
   * Ein unlesbarer Altstand wird als Sicherung umbenannt und blockiert nichts.
   */
  function migriereEinzelstand(speicher, jetzt, zufallFn) {
    var altKey = B.SPEICHER_SCHLUESSEL;
    if (!SS.kern.speicher.vorhanden(speicher, altKey)) return { profil: null, fehler: null };
    var roh = speicher.getItem(altKey);
    var r = SS.kern.speicher.lade(speicher, altKey);
    if (!r.zustand) {
      try { speicher.setItem(altKey + "_defekt", roh); speicher.removeItem(altKey); } catch (e) { /* egal */ }
      return { profil: null, fehler: "Alter Spielstand konnte nicht übernommen werden (" + r.fehler + "). Eine Sicherung wurde angelegt." };
    }
    var idx = ladeIndex(speicher).index;
    var z = r.zustand;
    if (nameVergeben(idx, z.name)) z.name = (z.name + " (alt)").slice(0, 24);
    var id = neueId(jetzt, zufallFn);
    var zuletzt = z.zeit.zuletztGespeichert || z.zeit.letzterTick || jetzt;
    speicher.setItem(spielstandSchluessel(id), JSON.stringify(z)); // unverändert übernehmen (Offline-Zeit läuft ab altem Speicherzeitpunkt)
    var m = meta(id, z, zuletzt);
    idx.profile.push(m);
    schreibeIndex(speicher, idx);
    try { speicher.setItem(altKey + "_uebernommen", roh); speicher.removeItem(altKey); } catch (e) { /* egal */ }
    return { profil: m, fehler: null };
  }

  /** Profile, zuletzt gespielte zuerst. */
  function liste(speicher) {
    var r = ladeIndex(speicher);
    var l = r.index.profile.slice().sort(function (a, b) { return b.zuletztGespielt - a.zuletztGespielt; });
    return { profile: l, fehler: r.fehler };
  }

  /**
   * Legt einen neuen Spieler an – automatischer Start auf zufälligem Hauptplaneten.
   * Rückgabe { profil, zustand, fehler }.
   */
  function erstelle(speicher, opt) {
    opt = opt || {};
    var jetzt = Number(opt.jetzt);
    var idx = ladeIndex(speicher).index;
    var name = String(opt.name || "").trim().slice(0, 24);
    if (!name) return { profil: null, zustand: null, fehler: "Bitte einen Spielernamen eingeben." };
    if (nameVergeben(idx, name)) return { profil: null, zustand: null, fehler: "Den Spieler „" + name + "“ gibt es schon." };
    if (idx.profile.length >= B.MAX_PROFILE) return { profil: null, zustand: null, fehler: "Höchstens " + B.MAX_PROFILE + " Spieler möglich." };
    var z = SS.kern.zustand.neuerSpielstand({ name: name, planetName: opt.planetName, jetzt: jetzt, zufall: opt.zufall });
    var id = neueId(jetzt, opt.zufall);
    SS.kern.speicher.speichere(speicher, z, jetzt, spielstandSchluessel(id));
    var m = meta(id, z, jetzt);
    idx.profile.push(m);
    schreibeIndex(speicher, idx);
    return { profil: m, zustand: z, fehler: null };
  }

  function finde(idx, id) {
    for (var i = 0; i < idx.profile.length; i++) if (idx.profile[i].id === id) return idx.profile[i];
    return null;
  }

  /** Lädt den Spielstand eines Profils (ohne Offline-Fortschritt). Rückgabe { zustand, fehler }. */
  function ladeProfil(speicher, id) {
    if (!finde(ladeIndex(speicher).index, id)) return { zustand: null, fehler: "Spieler nicht gefunden." };
    var r = SS.kern.speicher.lade(speicher, spielstandSchluessel(id));
    if (!r.zustand && !r.fehler) return { zustand: null, fehler: "Für diesen Spieler fehlt der Spielstand." };
    return r;
  }

  /** Speichert den Spielstand eines Profils und aktualisiert dessen Eintrag in der Liste. */
  function speichereProfil(speicher, id, zustand, jetzt) {
    SS.kern.speicher.speichere(speicher, zustand, jetzt, spielstandSchluessel(id));
    var idx = ladeIndex(speicher).index;
    var alt = finde(idx, id);
    var m = meta(id, zustand, jetzt, alt);
    if (alt) idx.profile[idx.profile.indexOf(alt)] = m; else idx.profile.push(m);
    schreibeIndex(speicher, idx);
    return m;
  }

  /** Löscht ein Profil samt Spielstand. */
  function loesche(speicher, id) {
    var idx = ladeIndex(speicher).index;
    idx.profile = idx.profile.filter(function (p) { return p.id !== id; });
    schreibeIndex(speicher, idx);
    SS.kern.speicher.loesche(speicher, spielstandSchluessel(id));
    return true;
  }

  /**
   * Setzt NUR den Spielstand dieses Profils zurück (ANNAHME: Name und Hauptplanet bleiben, alles andere neu).
   * Rückgabe { zustand, fehler }.
   */
  function zuruecksetzen(speicher, id, jetzt) {
    var idx = ladeIndex(speicher).index;
    var p = finde(idx, id);
    if (!p) return { zustand: null, fehler: "Spieler nicht gefunden." };
    var alt = SS.kern.speicher.lade(speicher, spielstandSchluessel(id)).zustand;
    var z = SS.kern.zustand.neuerSpielstand({ name: p.name, jetzt: jetzt });
    if (alt) z.heimat = alt.heimat;
    speichereProfil(speicher, id, z, jetzt);
    return { zustand: z, fehler: null };
  }

  SS.kern.profile = {
    spielstandSchluessel: spielstandSchluessel,
    ladeIndex: ladeIndex,
    migriereEinzelstand: migriereEinzelstand,
    liste: liste,
    erstelle: erstelle,
    ladeProfil: ladeProfil,
    speichereProfil: speichereProfil,
    loesche: loesche,
    zuruecksetzen: zuruecksetzen
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
