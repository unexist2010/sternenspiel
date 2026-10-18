# Sternenspiel – Spezifikation

Stand: 2026-10-18 · Kapitel 1

**Wichtig:** Abschnitt A enthält nur, was Sandro festgelegt hat (**FEST**). Alles in Abschnitt B ist von mir
gesetzt (**ANNAHME**) und kann jederzeit geändert werden – die Zahlen stehen zentral in `js/data/konstanten.js`.

---

## A. Verbindlich (FEST, aus Sandros Chat)

| # | Punkt | Umgesetzt in |
|---|-------|--------------|
| 1 | Rohstoffe: **Metall, Silizium, Rohöl, Strom, Kunststoff in Tier T1, T2, T3, Antimaterie** | Kapitel 1 (`js/data/rohstoffe.js`) |
| 2 | **Geologiestation** (Gebäude, z. B. zum Erkunden/Bestimmen der Lagerstätten bzw. Rohstoffvorkommen) | Kapitel 2 (Platzhalter in `js/data/gebaeude.js`) |
| 3 | **Startplätze A–Z**, jeder mit **Stufe 1–15** | Kapitel 1 (`js/data/startplaetze.js`) |
| 4 | **23 Schiffe**, **5 Waffentypen**, **zwei Hüllentypen** | Kapitel 4 (Soll-Anzahlen in `js/data/schiffe.js`) |
| 5 | **Schutzschild-Autoaktivierung** als Solo-Regel | Kapitel 5 (Einstellung `schildAutoaktivierung` im Spielstand angelegt) |
| 6 | **Trümmer-Salvage: 50–75 % am Boden, 80 % im Orbit** | Kapitel 5 |
| 7 | **Treibstoffregeln** (Inhalt noch nicht festgelegt) | Kapitel 6 |
| 8 | **KI-Gegner: 5–10 Angriffe/Ereignisse täglich** | Kapitel 7 |
| 9 | **Kapitelstruktur 1–7** plus Abschnitt „Offene Punkte“ | `docs/KAPITELPLAN.md`, `docs/OFFENE-PUNKTE.md` |

---

## B. Annahmen (ANNAHME – nicht von Sandro festgelegt)

### B1. Startplätze

| Annahme | Wert |
|---------|------|
| Zuordnung Buchstabe → Stufe | fest: `Stufe = ((Index × 4) mod 15) + 1` (A=1, B=5, C=9, D=13, E=2, … L=15, … Z=11); jede Stufe 1–15 kommt vor |
| Stufe veränderbar? | in Kapitel 1 **nein** (fest pro Startplatz) |
| Schwerpunkt-Rohstoff | reihum Metall → Silizium → Rohöl → Strom (A=Metall, B=Silizium, C=Rohöl, D=Strom, E=Metall …) |
| Bedeutung der Stufe | höhere Stufe = höhere Rohstoffboni (kein Nachteil in Kapitel 1) |

**Boni-Formel (ANNAHME)** – gilt nur für Grundrohstoffe (Metall, Silizium, Rohöl, Strom):

```
Multiplikator = 1 + (Stufe − 1) × 2 %   [alle Grundrohstoffe]
                  + Stufe × 3 %          [nur Schwerpunkt-Rohstoff]
```

| Stufe | übrige Grundrohstoffe | Schwerpunkt |
|-------|----------------------|-------------|
| 1  | +0 %  | +3 %  |
| 5  | +8 %  | +23 % |
| 10 | +18 % | +48 % |
| 15 | +28 % | +73 % |

### B2. Wirtschaft / Zeit

| Annahme | Wert |
|---------|------|
| Grundproduktion/Std. (ohne Gebäude) | Metall 120, Silizium 80, Rohöl 60, Strom 100; Kunststoff T1–T3 und Antimaterie 0 (erst ab Kapitel 2/3) |
| Startbestand | Metall 500, Silizium 300, Rohöl 200, Strom 100, Kunststoff T1 50, Rest 0 |
| Grund-Lager | Metall/Silizium/Rohöl 10.000, Strom 5.000, K1 2.000, K2 1.000, K3 500, Antimaterie 100 |
| Strom | wird in Kapitel 1 wie ein lagerbarer Rohstoff behandelt (nicht als Leistungsbilanz) |
| Lager voll | Produktion stoppt; Überbestand (z. B. spätere Beute) bleibt erhalten, wächst aber nicht |
| Tick | Anzeige 1×/s; Produktion rechnet mit echter Zeitdifferenz (exakt, unabhängig von Tick-Ausfällen) |
| Offline-Fortschritt | seit letztem Speichern, **max. 24 Std.** angerechnet, volle Rate (kein Abschlag) |
| Uhr zurückgestellt | keine Gutschrift, Referenzzeit wird neu gesetzt |
| Autospeichern | alle 30 s, beim Verstecken/Verlassen des Tabs, bei „Hauptmenü“ |

### B3. Technik

| Annahme | Begründung |
|---------|------------|
| Klassische `<script>`-Dateien mit gemeinsamem Namensraum `SS` statt ES-Module | ES-Module werden von Chrome über `file://` blockiert |
| Spielstand-Format mit `version` + Migration | spätere Kapitel können Felder ergänzen, alte Stände bleiben ladbar |
| Leere Andockfelder im Spielstand: `gebaeude`, `lagerstaetten`, `forschung`, `schiffe`, `flotten`, `truemmerfelder`, `ereignisse`, `einstellungen.schildAutoaktivierung` | Kapitel 2–7 docken ohne Formatbruch an |
| Rohstoff-Kürzel/Farben (Me, Si, Öl, St, K1–K3, AM) | Darstellung; keine Emoji, damit überall gleich aussehend |

### B4. Für spätere Kapitel vorgemerkt (noch nicht umgesetzt)

- Trümmer-Salvage am Boden 50–75 %: **Zufallswert** im Bereich oder abhängig von etwas (z. B. Geologiestation/Schiffstyp)? → offen
- KI 5–10 Ereignisse/Tag: zufällig über den Tag verteilt, auch offline nachgeholt? → offen
