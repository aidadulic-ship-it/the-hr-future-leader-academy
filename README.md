# HR Future Thinkers Academy

Eigenständige lokale Lernplattform mit neuer UX nach dem gelieferten Work-Paket. Die alten HTML-Dateien dienten als Inhalts- und Funktionsreferenz. Die Anwendung nutzt Node.js ohne externe Laufzeitpakete.

**Start:** [INSTALLATION.md](INSTALLATION.md) lesen, dann `npm start`. **Tests:** `npm test`.

**GitHub-Upload:** [GITHUB_UPLOAD.md](GITHUB_UPLOAD.md). Das Repository allein veröffentlicht die laufende Academy nicht.

Die Dateien im Repository-Stammverzeichnis bilden eine **GitHub-Pages-Demo**. Sie zeigt das Layout und die Lerninhalte, speichert Übungsantworten lokal im Browser und braucht keine API. Die Mehrpersonen-Plattform mit Konten und Campus liegt unter `src/` und benötigt einen Node.js-Host.

Die Illustrationen liegen unter [`assets/`](assets/): sechs hochauflösende PNG-Kartenbilder, sechs SVG-Navigationsicons und ein Hero-Motiv. Die Kartenbilder wurden anhand des von der Nutzerin gezeigten Screenshots visuell rekonstruiert. Die Original-Bilddateien waren im Importpaket nicht enthalten. Pages und Serverversion laden dieselben Assets.

Die sechs Bereiche sind My Future Path, Competency Worlds, Decision Lab, Knowledge Hub, Practice Studio und Teaching Studio. Lernantworten werden serverseitig einem Konto zugeordnet. Campusrollen begrenzen Kursverwaltung, Einreichungen und Feedback. Persönliche Daten lassen sich exportieren und ein Konto löschen; wenn eine Person die letzte Campusadministration ist, muss die Verwaltung vorher übertragen werden.

Der Katalog enthält redaktionell rekonstruierte Inhalte. Quellenstatus, synthetische Fälle, nicht verfügbare Originale und Funktionsgrenzen stehen in [INHALTSSTATUS.md](INHALTSSTATUS.md). Der Teststand steht in [TESTBERICHT.md](TESTBERICHT.md).
