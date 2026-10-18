/*
 * Sternenspiel – Oberfläche (Kapitel 1).
 * Verbindet die DOM-Elemente aus index.html mit der Logik in js/kern/.
 */
(function () {
  "use strict";
  var SS = window.SS;
  var B = SS.BALANCE, D = SS.DATEN, P = SS.kern.produktion, S = SS.kern.speicher, Z = SS.kern.zustand, F = SS.format;

  var zustand = null;        // aktueller Spielstand (null = nicht im Spiel)
  var tickTimer = null, autoTimer = null;
  var gewaehlt = null;       // gewählter Startplatz-Buchstabe
  var sortierung = "buchstabe";

  function $(id) { return document.getElementById(id); }
  function jetzt() { return Date.now(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Speicher: localStorage kann bei file:// in manchen Browsern gesperrt sein → Ersatz im Arbeitsspeicher
  var speicher = (function () {
    try { var k = "__ss_test__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; }
    catch (e) {
      var m = {}; window.__speicherFluechtig = true;
      return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
    }
  })();

  // ---------- Bildschirme ----------
  function zeige(name) {
    ["start", "neu", "spiel"].forEach(function (n) { $("bildschirm-" + n).classList.toggle("aktiv", n === name); });
    window.scrollTo(0, 0);
  }

  function meldung(text, art) {
    var el = $("meldung");
    el.textContent = text;
    el.className = "meldung sichtbar" + (art ? " " + art : "");
    clearTimeout(meldung._t);
    meldung._t = setTimeout(function () { el.className = "meldung"; }, 2800);
  }

  function dialog(titel, html, mitAbbrechen) {
    return new Promise(function (fertig) {
      $("dialog-titel").textContent = titel;
      $("dialog-text").innerHTML = html;
      $("dialog-abbrechen").hidden = !mitAbbrechen;
      $("dialog").hidden = false;
      $("dialog-ok").focus();
      function schliesse(ok) {
        $("dialog").hidden = true;
        $("dialog-ok").onclick = $("dialog-abbrechen").onclick = null;
        fertig(ok);
      }
      $("dialog-ok").onclick = function () { schliesse(true); };
      $("dialog-abbrechen").onclick = function () { schliesse(false); };
    });
  }

  // ---------- Startbildschirm ----------
  function zeigeStart() {
    stoppeSchleifen();
    zustand = null;
    var r = S.lade(speicher);
    var info = $("start-spielstand"), fehler = $("start-fehler");
    fehler.hidden = !r.fehler;
    fehler.textContent = r.fehler ? r.fehler + " – bitte ein neues Spiel beginnen." : "";
    if (r.zustand) {
      var z = r.zustand;
      info.hidden = false;
      info.innerHTML = "<b>" + esc(z.name) + "</b> · Startplatz " + z.startplatz.buchstabe + " (Stufe " + z.startplatz.stufe + ")" +
        "<br><span class=\"hinweis\">Zuletzt gespeichert: " + (z.zeit.zuletztGespeichert ? F.uhrzeit(z.zeit.zuletztGespeichert) : "–") + "</span>";
      $("knopf-weiterspielen").hidden = false;
    } else {
      info.hidden = true;
      $("knopf-weiterspielen").hidden = true;
    }
    zeige("start");
  }

  // ---------- Neues Spiel ----------
  function zeigeNeu() {
    gewaehlt = null;
    $("knopf-starten").disabled = true;
    $("knopf-starten").textContent = "Spiel starten";
    zeichneStartplaetze();
    zeichneDetails();
    zeige("neu");
  }

  function zeichneStartplaetze() {
    var liste = D.startplaetze.slice();
    if (sortierung === "stufe") liste.sort(function (a, b) { return b.stufe - a.stufe || a.buchstabe.localeCompare(b.buchstabe); });
    $("startplatz-raster").innerHTML = liste.map(function (sp) {
      var r = D.rohstoffNachId(sp.schwerpunkt);
      var st = Math.round((sp.stufe - 1) / 14 * 100);
      return "<button class=\"startplatz" + (sp.buchstabe === gewaehlt ? " gewaehlt" : "") + "\" role=\"option\" aria-selected=\"" + (sp.buchstabe === gewaehlt) +
        "\" data-buchstabe=\"" + sp.buchstabe + "\" style=\"--stufe:" + st + "%\">" +
        "<span class=\"sp-buchstabe\">" + sp.buchstabe + "</span>" +
        "<span class=\"sp-stufe\">Stufe " + sp.stufe + "</span>" +
        "<span class=\"sp-schwerpunkt\" style=\"color:" + r.farbe + "\">" + r.kurz + "</span>" +
        "<span class=\"sp-balken\"><i></i></span></button>";
    }).join("");
  }

  function zeichneDetails() {
    var el = $("startplatz-details");
    var sp = gewaehlt && D.startplatzNachBuchstabe(gewaehlt);
    if (!sp) { el.innerHTML = "<p class=\"hinweis\">Tippe auf einen Startplatz, um Details zu sehen.</p>"; return; }
    var probe = { startplatz: sp };
    var zeilen = D.rohstoffe.filter(function (r) { return r.gruppe === "grund"; }).map(function (r) {
      var m = P.startplatzMultiplikator(probe.startplatz, r.id);
      var prod = (B.GRUNDPRODUKTION_PRO_STUNDE[r.id] || 0) * m;
      return "<li" + (r.id === sp.schwerpunkt ? " class=\"schwerpunkt\"" : "") + "><span class=\"rs-marke\" style=\"--farbe:" + r.farbe + "\">" + r.kurz + "</span> " +
        r.name + ": <b>" + F.prozent(m) + "</b> → " + F.rate(prod) + "/Std." + (r.id === sp.schwerpunkt ? " ★" : "") + "</li>";
    }).join("");
    el.innerHTML = "<h3>" + sp.name + " · Stufe " + sp.stufe + "</h3>" +
      "<p>Schwerpunkt: <b>" + D.rohstoffNachId(sp.schwerpunkt).name + "</b></p><ul class=\"boni\">" + zeilen + "</ul>";
  }

  function starteNeuesSpiel() {
    if (!gewaehlt) return;
    var los = function () {
      zustand = Z.neuerSpielstand({ name: $("eingabe-name").value, startplatz: gewaehlt, jetzt: jetzt() });
      S.speichere(speicher, zustand, jetzt());
      betreteSpiel();
      meldung("Willkommen auf Startplatz " + zustand.startplatz.buchstabe + "!", "gut");
    };
    if (S.vorhanden(speicher)) {
      dialog("Neues Spiel beginnen?", "<p>Der vorhandene Spielstand wird <b>überschrieben</b>.</p>", true).then(function (ok) { if (ok) los(); });
    } else los();
  }

  // ---------- Spiel ----------
  function betreteSpiel() {
    zeige("spiel");
    baueRessourcenLeiste();
    baueProduktionsTabelle();
    zeichneSpiel();
    stoppeSchleifen();
    tickTimer = setInterval(function () { P.tick(zustand, jetzt()); zeichneSpiel(); }, B.TICK_MS);
    autoTimer = setInterval(function () { speichern(true); }, B.AUTOSPEICHERN_MS);
  }

  function stoppeSchleifen() {
    clearInterval(tickTimer); clearInterval(autoTimer);
    tickTimer = autoTimer = null;
  }

  function baueRessourcenLeiste() {
    $("ressourcen-leiste").innerHTML = D.rohstoffe.map(function (r) {
      return "<div class=\"rs\" title=\"" + r.name + "\" data-rohstoff=\"" + r.id + "\" style=\"--farbe:" + r.farbe + "\">" +
        "<span class=\"rs-marke\">" + r.kurz + "</span>" +
        "<span class=\"rs-text\"><span class=\"rs-name\">" + r.name + "</span><span class=\"rs-wert\">0</span><span class=\"rs-rate\"></span></span></div>";
    }).join("");
  }

  function baueProduktionsTabelle() {
    $("produktion-tabelle").querySelector("tbody").innerHTML = D.rohstoffe.map(function (r) {
      return "<tr data-rohstoff=\"" + r.id + "\"><td><span class=\"rs-marke\" style=\"--farbe:" + r.farbe + "\">" + r.kurz + "</span> " + r.name + "</td>" +
        "<td class=\"z bestand\"></td><td class=\"z lager\"></td><td class=\"z rate\"></td><td class=\"z bonus\"></td></tr>";
    }).join("");
  }

  function zeichneSpiel() {
    if (!zustand) return;
    var prod = P.produktionProStunde(zustand);
    D.rohstoffe.forEach(function (r) {
      var wert = zustand.rohstoffe[r.id], kap = P.lagerKapazitaet(zustand, r.id), voll = wert >= kap;
      var kachel = document.querySelector(".rs[data-rohstoff=\"" + r.id + "\"]");
      kachel.querySelector(".rs-wert").textContent = F.kurz(wert);
      kachel.querySelector(".rs-rate").textContent = prod[r.id] > 0 ? (voll ? "Lager voll" : "+" + F.rate(prod[r.id]) + "/h") : "–";
      kachel.classList.toggle("voll", voll && prod[r.id] > 0);
      var zeile = document.querySelector("#produktion-tabelle tr[data-rohstoff=\"" + r.id + "\"]");
      zeile.querySelector(".bestand").textContent = F.zahl(wert);
      zeile.querySelector(".lager").textContent = F.zahl(kap);
      zeile.querySelector(".rate").textContent = F.rate(prod[r.id]);
      var m = P.startplatzMultiplikator(zustand.startplatz, r.id);
      zeile.querySelector(".bonus").textContent = m > 1 ? F.prozent(m) : "–";
    });
    var sp = zustand.startplatz;
    $("basis-info").innerHTML =
      "<dl class=\"werte\"><dt>Kommandant</dt><dd>" + esc(zustand.name) + "</dd>" +
      "<dt>Startplatz</dt><dd>" + sp.buchstabe + " · Stufe " + sp.stufe + "</dd>" +
      "<dt>Schwerpunkt</dt><dd>" + D.rohstoffNachId(sp.schwerpunkt).name + "</dd>" +
      "<dt>Spiel seit</dt><dd>" + F.uhrzeit(zustand.erstelltAm) + "</dd>" +
      "<dt>Offline erhalten</dt><dd>" + F.dauer(zustand.statistik.offlineMsGesamt) + "</dd></dl>";
    $("speicher-info").textContent = (zustand.zeit.zuletztGespeichert ? "Zuletzt gespeichert: " + F.uhrzeit(zustand.zeit.zuletztGespeichert) : "Noch nicht gespeichert") +
      " · Autospeichern alle " + Math.round(B.AUTOSPEICHERN_MS / 1000) + " s" + (window.__speicherFluechtig ? " · ACHTUNG: Browser erlaubt kein dauerhaftes Speichern" : "");
  }

  function speichern(still) {
    if (!zustand) return;
    try {
      S.speichere(speicher, zustand, jetzt());
      zeichneSpiel();
      if (!still) meldung("Spielstand gespeichert.", "gut");
    } catch (e) {
      meldung("Speichern fehlgeschlagen: " + e.message, "schlecht");
    }
  }

  function ladeUndBetrete() {
    var r = S.lade(speicher);
    if (!r.zustand) { meldung(r.fehler || "Kein Spielstand vorhanden.", "schlecht"); zeigeStart(); return; }
    zustand = r.zustand;
    var off = P.offlineFortschritt(zustand, jetzt());
    betreteSpiel();
    if (off.angerechnetMs >= 60000) {
      var liste = D.rohstoffe.filter(function (x) { return off.gewinne[x.id] >= 1; }).map(function (x) {
        return "<li><span class=\"rs-marke\" style=\"--farbe:" + x.farbe + "\">" + x.kurz + "</span> " + x.name + ": +" + F.zahl(off.gewinne[x.id]) + "</li>";
      }).join("");
      dialog("Willkommen zurück!", "<p>Du warst <b>" + F.dauer(off.abwesendMs) + "</b> weg." +
        (off.gekappt ? " Angerechnet werden höchstens " + B.OFFLINE_MAX_STUNDEN + " Std." : "") + "</p>" +
        (liste ? "<ul class=\"boni\">" + liste + "</ul>" : "<p>Deine Lager waren bereits voll.</p>"), false);
    } else {
      meldung("Spielstand geladen.", "gut");
    }
    speichern(true);
  }

  function zuruecksetzen() {
    dialog("Spielstand zurücksetzen?", "<p>Der gesamte Fortschritt wird <b>unwiderruflich gelöscht</b>.</p>", true).then(function (ok) {
      if (!ok) return;
      S.loesche(speicher);
      zeigeStart();
      meldung("Spielstand gelöscht.");
    });
  }

  // ---------- Ereignisse ----------
  $("knopf-neues-spiel").addEventListener("click", zeigeNeu);
  $("knopf-weiterspielen").addEventListener("click", ladeUndBetrete);
  $("knopf-zurueck").addEventListener("click", zeigeStart);
  $("knopf-starten").addEventListener("click", starteNeuesSpiel);
  $("knopf-speichern").addEventListener("click", function () { speichern(false); });
  $("knopf-laden").addEventListener("click", function () {
    dialog("Letzten Spielstand laden?", "<p>Nicht gespeicherter Fortschritt seit dem letzten Speichern geht verloren (Offline-Produktion wird dabei angerechnet).</p>", true)
      .then(function (ok) { if (ok) ladeUndBetrete(); });
  });
  $("knopf-menue").addEventListener("click", function () { speichern(true); zeigeStart(); });
  $("knopf-zuruecksetzen").addEventListener("click", zuruecksetzen);
  $("startplatz-raster").addEventListener("click", function (e) {
    var b = e.target.closest(".startplatz");
    if (!b) return;
    gewaehlt = b.getAttribute("data-buchstabe");
    $("knopf-starten").disabled = false;
    $("knopf-starten").textContent = "Spiel starten · " + gewaehlt + " (Stufe " + D.startplatzNachBuchstabe(gewaehlt).stufe + ")";
    zeichneStartplaetze();
    zeichneDetails();
  });
  $("startplatz-filter").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sort]");
    if (!b) return;
    sortierung = b.getAttribute("data-sort");
    Array.prototype.forEach.call(this.querySelectorAll("[data-sort]"), function (x) { x.classList.toggle("aktiv", x === b); });
    zeichneStartplaetze();
  });
  document.addEventListener("keydown", function (e) {
    if (!$("dialog").hidden && e.key === "Escape") $(!$("dialog-abbrechen").hidden ? "dialog-abbrechen" : "dialog-ok").click();
  });
  // Beim Verlassen/Verstecken des Tabs speichern (Offline-Fortschritt rechnet ab diesem Zeitpunkt)
  document.addEventListener("visibilitychange", function () { if (document.hidden) speichern(true); });
  window.addEventListener("pagehide", function () { speichern(true); });

  SS.app = { get zustand() { return zustand; }, speichern: speichern }; // für Konsole/Playtest
  zeigeStart();
})();
