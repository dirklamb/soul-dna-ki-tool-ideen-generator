# Soul-DNA KI-Tool-Ideen-Generator

Ein interaktives Web-Tool für Berater, Coaches, Heiler:innen und Expert:innen 45+:
Aus wenigen Angaben zu Nische, Zielgruppe, Problem, Traum-Ergebnis, Angebot und
eigener Expertise entstehen 5 außergewöhnliche, sofort umsetzbare KI-Tool-Ideen —
inklusive fertigem Bau-Prompt pro Idee.

Optional lassen sich eine **Soul-Autoritäts-Signatur** und ein **Zukunfts-Profil**
(aus der Durchstarter-Challenge) ergänzen. Sie verändern sichtbar Tool-Namen,
Ergebnis-Namen, Sprache und Positionierung der Ideen.

## Eigenschaften

- Läuft komplett **ohne Login und ohne externe API** — reines HTML/CSS/JavaScript.
- Funktioniert direkt über **GitHub Pages** (statische Dateien, kein Build-Schritt).
- Mobile und Desktop responsive, hochwertiges Design in DSC-Blau (`#016E8E`) mit
  Champagner-/Gold-Akzenten für Sterne, Top-Empfehlung und Highlights.
- Die gesamte Ideen-Logik steckt in `js/generator.js` als deterministisches
  Extraktions- und Template-System (keine KI-API-Aufrufe zur Laufzeit).

## Lokal starten

Da die App als ES-Module lädt, muss sie über einen einfachen HTTP-Server
aufgerufen werden (nicht per `file://`):

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080/
```

## Tests

Die Ideen-Engine wird mit Node's eingebautem Test-Runner geprüft
(4 Beispiel-Nischen, jeweils mit und ohne Soul-DNA-Angaben):

```bash
npm test
```

## Struktur

```
index.html          Wizard + Ergebnis-Screens
styles.css           Design-System (Farben, Typografie, Karten, Responsive)
js/generator.js       Ideen-Engine (reine Logik, keine DOM-Zugriffe)
js/app.js             UI-Logik (Wizard-Steuerung, Rendering, Bau-Prompt-Copy)
tests/generator.test.mjs  Automatisierte Tests der Ideen-Engine
```

## GitHub Pages aktivieren

Unter *Settings → Pages* die Quelle auf den `main`-Branch (Root-Verzeichnis)
stellen — die App ist dann direkt unter der Pages-URL erreichbar.
