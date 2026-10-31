# Balance Waffen & Hüllen – 0.17.0 (Sandro pt47u)

Papier-Simulation zuerst (`node tools/balance-sim.js <budget>`, gleiche Regeln wie `js/kern/kampf.js`: Erwartungswerte, 6 Runden je Phase, Feuer proportional verteilt, beide Hüllen gleichzeitig). Kein Schnellfeuer – jede Einheit feuert ihren Standard-Angriff einmal je Runde.

## Regeln
- **Metallhülle 0 = Einheit tot**, egal wie viel Energiehülle übrig ist (Stückzahl wird aus der Metallhülle abgeleitet).
- Metall-Waffen (Profil Metall ≥ 0,5) treffen Metall ×1,5, sobald die Energiehülle gebrochen bzw. nicht vorhanden ist; Energie-Waffen fallen dann auf ×0,5.
- **Railgun** ignoriert die Energiehülle: kein Energieschaden, Metallschaden immer ×1,5.
- **EMP (nur Titan):** vor Runde 1 jeder Phase setzt jeder lebende Titan mit EMP-Technologie Stufe L die Energiehülle von bis zu **25·L** gegnerischen Einheiten auf 0 – nur Gruppen mit Energiehülle je Einheit ≤ **1.000·L** (größte zuerst). Planetenschilde sind immun. Graviton-Technologie → EMP-Technologie (Spielstände werden migriert).

## Waffenfaktoren (Schaden gegen Energie / Metall)
| Waffe | Energie | Metall | Rolle |
|---|---|---|---|
| Maschinengewehr (gatling) | 0,3 | 0,9 | Früh, große Sekundärwaffe |
| Raketen | 0,2 | 1,1 | Metall-Killer, früh |
| Laser | 1,0 | 0,45 | Energie stark, Metall teils |
| Ionen | 1,5 | 0,25 | Schild-Brecher |
| Plasma | 1,0 | 1,0 | groß, ausgewogen |
| Railgun | – (ignoriert) | 1,0 | Einzelschuss, Metall ×1,5 immer |

## Hüllenziele & Bewaffnung
Frühe Schiffe ohne/mit kleiner Energiehülle (Metallfokus); ab Korvette Energiehülle ≈ 15–30 % der Metallhülle.

| Schiff | Waffen | Angriff | Energiehülle |
|---|---|---|---|
| Aufklärer | MG 100 % | 15 | 0 |
| Kleine Drohne | MG 70 / Raketen 30 | 60 | 0 |
| Mittlere Drohne | MG 50 / Raketen 50 | 120 | 0 |
| Schwere Drohne | Raketen 60 / MG 40 | 200 | 100 |
| Korvette | MG 50 / Laser 50 | 380 | 300 |
| Fregatte | Railgun 50 / Laser 50 | 480 | 500 |
| Zerstörer | MG 60 / Laser 40 | 750 | 700 |
| Kreuzer | Ionen 50 / Railgun 50 | 1.000 | 1.100 |
| Bomber | Plasma 60 / Raketen 40 | 1.000 | 1.600 |
| Schlachtkreuzer | Laser 60 / Railgun 40 | 1.500 | 3.000 |
| Schlachtschiff | Plasma 50 / Railgun 50 | 1.300 | 3.000 |
| Träger | Raketen 60 / Laser 40 | 600 | 4.500 |
| Koloss | Plasma 60 / Ionen 40 | 8.000 | 20.000 |
| Titan (EMP) | Plasma 60 / Railgun 30 / MG 10 | 60.000 | 200.000 |

| Verteidigung | Angriff | Energiehülle |
|---|---|---|
| Maschinen-Nest | 40 | 0 |
| Raketenbatterie | 40 | 0 |
| Laserturm | 130 | 50 |
| Pulslaser | 550 | 200 |
| Railgun-Turm (id magnetkanone) | 500 | 800 |
| Ionengeschütz | 650 | 500 |
| Plasmaturm | 2.200 | 2.500 |
| Orbitalplattform | 2.000 | 5.000 |

## Beispielkämpfe (Early / Mid / Late)
```
E1 Early: 15 Kl. Drohnen vs 10 Raketenbatterie + 10 Maschinen-Nest
  A {"kleine_drohne":15} vs B {"raketenbatterie":10,"maschinennest":10} 
  → Sieger A, Runden 5, Rest A [kleine_drohne:5] B [raketenbatterie:0 maschinennest:0], Wertverlust A 67% B 100% 
E2 Early: 20 Kl. Drohnen vs 30 Laser-Türme (Laser gegen Metall schwach)
  A {"kleine_drohne":20} vs B {"laserturm":30} 
  → Sieger offen, Runden 6, Rest A [kleine_drohne:10] B [laserturm:5], Wertverlust A 50% B 83% 
E3 Early: 10 Schw. Drohnen vs 7 Korvetten (gleiche Kosten ~)
  A {"schwere_drohne":10} vs B {"korvette":7} 
  → Sieger offen, Runden 6, Rest A [schwere_drohne:3] B [korvette:2], Wertverlust A 70% B 71% 
M1 Mid: 20 Fregatten vs 15 Zerstörer
  A {"fregatte":20} vs B {"zerstoerer":15} 
  → Sieger offen, Runden 6, Rest A [fregatte:6] B [zerstoerer:5], Wertverlust A 70% B 67% 
M2 Mid: 15 Kreuzer vs 40 Pulslaser + 20 Ionengeschütz
  A {"kreuzer":15} vs B {"pulslaser":40,"ionengeschuetz":20} 
  → Sieger A, Runden 5, Rest A [kreuzer:11] B [pulslaser:0 ionengeschuetz:0], Wertverlust A 27% B 100% 
M3 Mid: 100 Mittl. Drohnen vs 18 Zerstörer (Drohnen-Killer)
  A {"mittlere_drohne":100} vs B {"zerstoerer":18} 
  → Sieger offen, Runden 6, Rest A [mittlere_drohne:24] B [zerstoerer:5], Wertverlust A 76% B 72% 
L1 Late: 30 Schlachtschiffe vs 30 Schlachtkreuzer
  A {"schlachtschiff":30} vs B {"schlachtkreuzer":30} 
  → Sieger offen, Runden 6, Rest A [schlachtschiff:16] B [schlachtkreuzer:9], Wertverlust A 47% B 70% 
L2 Late: 20 Bomber vs 5 Plasma-Türme + 10 Railgun-Türme
  A {"bomber":20} vs B {"plasmaturm":5,"magnetkanone":10} 
  → Sieger A, Runden 5, Rest A [bomber:14] B [plasmaturm:0 magnetkanone:0], Wertverlust A 30% B 100% 
L3 Late: 1 Titan ohne EMP vs 60 Schlachtschiffe
  A {"titan":1} vs B {"schlachtschiff":60} 
  → Sieger offen, Runden 6, Rest A [titan:1] B [schlachtschiff:22], Wertverlust A 0% B 63% 
L4 Late: 1 Titan EMP 2 vs 60 Schlachtschiffe
  A {"titan":1} vs B {"schlachtschiff":60} {"empA":2}
  → Sieger offen, Runden 6, Rest A [titan:1] B [schlachtschiff:22], Wertverlust A 0% B 63% 
L5 Late: 1 Titan EMP 3 vs 60 Schlachtschiffe
  A {"titan":1} vs B {"schlachtschiff":60} {"empA":3}
  → Sieger offen, Runden 6, Rest A [titan:1] B [schlachtschiff:13], Wertverlust A 0% B 78% EMP: schlachtschiff Energiehülle 100 % → 0
L6 Late: 1 Titan EMP 3 + 30 Schlachtschiffe vs 12 Kolosse
  A {"titan":1,"schlachtschiff":30} vs B {"koloss":12} {"empA":3}
  → Sieger offen, Runden 6, Rest A [titan:1 schlachtschiff:0] B [koloss:5], Wertverlust A 31% B 58% 
```

## Gleichkosten-Matrix Schiffe (Score: höher = kosteneffizienter)
```
Matrix gleiche Kosten (300000): Wert-Verlust Zeile − Spalte (negativ = Zeile gewinnt Tausch)
                 aufkla kleine mittle schwer korvet fregat zersto kreuze bomber schlac schlac traege koloss
aufklaerer         0.00   0.88   0.88   0.92   0.89   0.92   1.00   1.00   1.00   0.77   1.00   0.29   1.00
kleine_drohne     -0.88   0.00  -0.08   0.28  -0.03  -0.13   0.14  -0.24   0.48  -0.20   0.64  -0.81   1.00
mittlere_drohne   -0.88   0.08   0.00   0.38  -0.01  -0.10   0.17  -0.23   0.50  -0.19   0.67  -0.81   1.00
schwere_drohne    -0.92  -0.28  -0.38   0.00   0.05   0.06   0.14   0.03   0.46  -0.09   0.59  -0.35   1.00
korvette          -0.89   0.03   0.01  -0.05   0.00   0.07   0.12   0.07   0.24  -0.04   0.56  -0.84   1.00
fregatte          -0.92   0.13   0.10  -0.06  -0.07   0.00   0.00   0.00   0.25  -0.17   0.50  -0.92   1.00
zerstoerer        -1.00  -0.14  -0.17  -0.14  -0.12   0.00   0.00   0.00   0.17  -0.11   0.56  -0.89   1.00
kreuzer           -1.00   0.24   0.23  -0.03  -0.07   0.00   0.00   0.00   0.17   0.00   0.50  -0.83   1.00
bomber            -1.00  -0.48  -0.50  -0.46  -0.24  -0.25  -0.17  -0.17   0.00  -0.17   0.42  -0.50   1.00
schlachtkreuzer   -0.77   0.20   0.19   0.09   0.04   0.17   0.11   0.00   0.17   0.00   0.33  -0.50   1.00
schlachtschiff    -1.00  -0.64  -0.67  -0.59  -0.56  -0.50  -0.56  -0.50  -0.42  -0.33   0.00  -1.00   1.00
traeger           -0.29   0.81   0.81   0.35   0.84   0.92   0.89   0.83   0.50   0.50   1.00   0.00   1.00
koloss            -1.00  -1.00  -1.00  -1.00  -1.00  -1.00  -1.00  -1.00  -1.00  -1.00  -1.00  -1.00   0.00
Summe (höher = kosteneffizienter): aufklaerer -10.55 | kleine_drohne -0.17 | mittlere_drohne -0.58 | schwere_drohne -0.31 | korvette -0.28 | fregatte 0.15 | zerstoerer 0.85 | kreuzer -0.21 | bomber 2.51 | schlachtkreuzer -1.02 | schlachtschiff 5.76 | traeger -8.16 | koloss 12.00
Matrix gleiche Kosten (2000000): Wert-Verlust Zeile − Spalte (negativ = Zeile gewinnt Tausch)
                 aufkla kleine mittle schwer korvet fregat zersto kreuze bomber schlac schlac traege koloss
aufklaerer         0.00   0.88   0.88   0.91   0.89   0.87   0.89   0.88   0.93   0.68   0.95   0.15   0.80
kleine_drohne     -0.88   0.00  -0.05   0.28  -0.15  -0.37  -0.11  -0.31   0.27  -0.31   0.11  -0.84  -0.10
mittlere_drohne   -0.88   0.05   0.00   0.38  -0.09  -0.29  -0.08  -0.29   0.35  -0.30   0.13  -0.83  -0.08
schwere_drohne    -0.91  -0.28  -0.38   0.00  -0.02  -0.11  -0.05  -0.14   0.25  -0.15   0.10  -0.80   0.23
korvette          -0.89   0.15   0.09   0.02   0.00   0.01  -0.03  -0.03   0.11  -0.04   0.15  -0.71   0.21
fregatte          -0.87   0.37   0.29   0.11  -0.01   0.00  -0.05  -0.05   0.11  -0.10   0.08  -0.73   0.21
zerstoerer        -0.89   0.11   0.08   0.05   0.03   0.05   0.00  -0.01   0.14  -0.01   0.19  -0.72   0.21
kreuzer           -0.88   0.31   0.29   0.14   0.03   0.05   0.01   0.00   0.18  -0.04   0.15  -0.71   0.22
bomber            -0.93  -0.27  -0.35  -0.25  -0.11  -0.11  -0.14  -0.18   0.00  -0.05   0.05  -0.75   0.15
schlachtkreuzer   -0.68   0.31   0.30   0.15   0.04   0.10   0.01   0.04   0.05   0.00   0.09  -0.55   0.10
schlachtschiff    -0.95  -0.11  -0.13  -0.10  -0.15  -0.08  -0.19  -0.15  -0.05  -0.09   0.00  -0.68   0.14
traeger           -0.15   0.84   0.83   0.80   0.71   0.73   0.72   0.71   0.75   0.55   0.68   0.00   0.50
koloss            -0.80   0.10   0.08  -0.23  -0.21  -0.21  -0.21  -0.22  -0.15  -0.10  -0.14  -0.50   0.00
Summe (höher = kosteneffizienter): aufklaerer -9.71 | kleine_drohne 2.46 | mittlere_drohne 1.93 | schwere_drohne 2.26 | korvette 0.95 | fregatte 0.63 | zerstoerer 0.76 | kreuzer 0.26 | bomber 2.94 | schlachtkreuzer 0.05 | schlachtschiff 2.54 | traeger -7.65 | koloss 2.59
Matrix gleiche Kosten (20000000): Wert-Verlust Zeile − Spalte (negativ = Zeile gewinnt Tausch)
                 aufkla kleine mittle schwer korvet fregat zersto kreuze bomber schlac schlac traege koloss
aufklaerer         0.00   0.88   0.88   0.91   0.88   0.86   0.88   0.86   0.91   0.60   0.90   0.12   0.53
kleine_drohne     -0.88   0.00  -0.06   0.27  -0.16  -0.38  -0.12  -0.34   0.21  -0.39   0.04  -0.81  -0.42
mittlere_drohne   -0.88   0.06   0.00   0.38  -0.09  -0.30  -0.08  -0.32   0.26  -0.38   0.07  -0.81  -0.41
schwere_drohne    -0.91  -0.27  -0.38   0.00  -0.02  -0.12  -0.05  -0.15   0.21  -0.23   0.07  -0.78  -0.39
korvette          -0.88   0.16   0.09   0.02   0.00   0.01  -0.04  -0.06   0.07  -0.11   0.09  -0.74  -0.39
fregatte          -0.86   0.38   0.30   0.12  -0.01   0.00  -0.05  -0.06   0.07  -0.14   0.03  -0.75  -0.40
zerstoerer        -0.88   0.12   0.08   0.05   0.04   0.05   0.00  -0.02   0.10  -0.06   0.12  -0.74  -0.34
kreuzer           -0.86   0.34   0.32   0.15   0.06   0.06   0.02   0.00   0.13  -0.09   0.09  -0.72  -0.34
bomber            -0.91  -0.21  -0.26  -0.21  -0.07  -0.07  -0.10  -0.13   0.00  -0.09   0.03  -0.70  -0.35
schlachtkreuzer   -0.60   0.39   0.38   0.23   0.11   0.14   0.06   0.09   0.09   0.00   0.12  -0.53  -0.25
schlachtschiff    -0.90  -0.04  -0.07  -0.07  -0.09  -0.03  -0.12  -0.09  -0.03  -0.12   0.00  -0.67  -0.37
traeger           -0.12   0.81   0.81   0.78   0.74   0.75   0.74   0.72   0.70   0.53   0.67   0.00   0.31
koloss            -0.53   0.42   0.41   0.39   0.39   0.40   0.34   0.34   0.35   0.25   0.37  -0.31   0.00
Summe (höher = kosteneffizienter): aufklaerer -9.20 | kleine_drohne 3.03 | mittlere_drohne 2.51 | schwere_drohne 3.02 | korvette 1.79 | fregatte 1.39 | zerstoerer 1.47 | kreuzer 0.84 | bomber 3.05 | schlachtkreuzer -0.23 | schlachtschiff 2.61 | traeger -7.45 | koloss -2.82
```

## Verteidigung bei gleichen Kosten
```
Def gleiche Kosten 3000000: Wertverlust Schiff − Def (positiv = Def gewinnt)
                 maschin raketen lasertu pulslas ionenge magnetk plasmat
kleine_drohne      -0.14    0.27   -0.30   -0.38   -0.58    0.01    0.08
schwere_drohne     -0.36   -0.15    0.17    0.06   -0.23    0.17    0.05
korvette            0.06    0.31    0.23    0.11   -0.12    0.26   -0.03
fregatte            0.29    0.51    0.22    0.11   -0.21    0.24   -0.05
zerstoerer          0.04    0.31    0.30    0.19   -0.06    0.29    0.03
kreuzer             0.28    0.50    0.28    0.16   -0.17    0.31    0.02
bomber             -0.32   -0.06    0.16    0.05   -0.14    0.15   -0.10
schlachtkreuzer     0.29    0.54    0.22    0.14   -0.12    0.27    0.06
schlachtschiff     -0.20    0.06    0.10   -0.00   -0.26    0.08   -0.14
koloss              0.29    0.34    0.41    0.10    0.13    0.38    0.27
```

## Bewusste Kompromisse
- Titan ist von einer kostengleichen Flotte in einem Kampf nicht zu knacken (Hülle folgt der Kostenformel); EMP nützt v. a. seiner Begleitflotte.
- Schlachtkreuzer: mehr Angriff als Schlachtschiff (Glaskanone), Schlachtschiff gewinnt das Duell.
- Aufklärer (−9) und Träger (−8, Drohnen separat) bewusst unter Gleichkosten-Schnitt; Ionengeschütz ist Spezialist gegen Energiehüllen.
