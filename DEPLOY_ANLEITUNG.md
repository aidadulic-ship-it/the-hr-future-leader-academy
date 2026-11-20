# Academy online stellen (ohne Technikwissen)

Ziel: Die Academy läuft dauerhaft im Internet, ist als App installierbar und speichert Konten sicher in der EU.
Du brauchst dafür ca. 20 Minuten. Alles Technische ist vorbereitet.

## Was du brauchst
- Ein GitHub-Konto mit diesem Projekt (hast du schon).
- Ein Konto bei **Render** (render.com), Zahlung per Karte.
- Optional: deine **Domain**, z. B. `academy.aidadulic.at`.

## Kosten (Richtwerte, bitte beim Anbieter prüfen)
- Render „Starter“-Dienst: ca. 7 USD pro Monat.
- Dauerhafter Datenträger (1 GB): ca. 0,25 USD pro Monat.
- Domain: nutzt du schon, keine Zusatzkosten.
Der Datenträger ist nötig, damit Konten und Antworten einen Neustart überleben.

## Schritt für Schritt
1. Auf render.com ein Konto anlegen und GitHub verbinden.
2. „New +“ → **Blueprint** wählen → dieses Repository auswählen. Render liest die Datei `render.yaml` und richtet alles in **Frankfurt** ein.
3. Nach dem ersten Start öffnet sich die Adresse deines Dienstes, z. B. `https://hr-future-thinkers-academy.onrender.com`.
4. **Setup-Schlüssel** finden: Render → dein Dienst → *Environment* → `ACADEMY_SETUP_KEY` (wird automatisch erzeugt). Kopiere ihn.
5. Auf der Academy-Seite unter „Konto“ die erste Administration einrichten (E-Mail, Passwort mit mindestens 12 Zeichen, Setup-Schlüssel). Danach ist der Schlüssel nicht mehr nötig.
6. Eigene Domain: Render → *Settings* → *Custom Domains* → Domain eintragen. Render zeigt dir einen DNS-Eintrag, den du bei deinem Domain-Anbieter hinterlegst. HTTPS richtet Render automatisch ein.

## Als App installieren
- **iPhone (Safari):** Teilen-Symbol → **Zum Home-Bildschirm**.
- **Android (Chrome):** Menü → **App installieren**.
- **Computer (Chrome/Edge):** Installations-Symbol in der Adressleiste.
Danach startet die Academy mit eigenem Icon im Vollbild. Lerninhalte sind auch ohne Internet lesbar. Anmelden und Antworten speichern brauchen eine Verbindung.

## Backup
- Die Academy sichert die Datendatei **täglich** (und bei jedem Neustart) in den Ordner `/var/data/backups` und behält die letzten 30 Tage.
- Diese Backups liegen auf demselben Datenträger. Sie schützen vor Fehlbedienung, nicht vor Verlust des Datenträgers. Aktiviere deshalb in Render unter dem Datenträger zusätzlich die **Disk Snapshots**.

## Passwort vergessen
Mitglieder melden sich bei dir oder ihrer Campus-Leitung. Unter „Konto“ → „Passwort zurücksetzen“ die E-Mail eintragen, das Einmal-Passwort persönlich weitergeben. Beim nächsten Login wird ein eigenes Passwort verlangt.

## Datenschutz und Impressum (vor dem öffentlichen Start!)
Mit Konten speicherst du personenbezogene Daten (E-Mail, Lernantworten).
- Du brauchst eine **Datenschutzerklärung** und ein **Impressum** auf deiner Website und einen Verweis in der Academy.
- Mit Render solltest du einen **Auftragsverarbeitungsvertrag (AVV/DPA)** abschließen. Render bietet ihn an.
- Lass die Texte rechtlich prüfen. Diese Anleitung ist keine Rechtsberatung.
