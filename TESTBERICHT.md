# Testbericht · 15. November 2026

Ausgeführt mit Node.js und `npm test` im Projektordner. Ergebnis: **9 Tests bestanden, 0 fehlgeschlagen**.

Geprüft wurden Katalogmengen und eindeutige IDs; sechs unterschiedliche Arbeitsschritte und zwei Niveaus je Skill; Kennzeichnung synthetischer Fälle; getrennte Kontodaten, Export und Löschung; Passwort-Hashing und Sitzungsende; Campusrollen, Sitzplatzgrenze, Kurs, Aufgabe, Einreichung und Lehrendenfeedback; API-Setup, Login, CSRF-Schutz, ID-Validierung und persistierte Lernantwort; Handler für alle deklarierten UI-Aktionen; relative Assets, vorhandene Bilddateien und Katalog der GitHub-Pages-Demo. Die sechs PNG-Kartenbilder wurden auf Existenz geprüft, und ein PNG wurde über den Server-Handler binär ausgeliefert.

`node --check app.js`, `node --check src/app.js` und `node --check src/server.mjs` bestanden. Die HTTP-Routen wurden direkt am echten Server-Handler geprüft. Lokale Netzwerkverbindungen waren in der Testumgebung gesperrt, daher lief kein Socket- oder visueller Browser-Test. Die veröffentlichte GitHub-Seite wurde von hier aus nicht erneut geöffnet. Responsive Darstellung, Tastaturbedienung, Screenreader-Verhalten und reale Browserkompatibilität sind **nicht** als abgenommen gekennzeichnet. Vor öffentlichem Einsatz sind diese Prüfungen nachzuholen.

Bekannte Grenzen: kein Passwort-Reset, kein Rate Limiting, keine externe KI, keine adaptive Verzweigung der Krisen, keine automatische Benotung, keine produktionsfertige Hosting-Konfiguration. Die Lerninhalte sind dort als rekonstruiert markiert, wo die Originale nicht geliefert wurden.
