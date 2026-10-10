# Trentham Yardage

GPS distances, hazard carries and shot logging for Trentham Golf Club (VIC).
A single-page web app that installs to a phone's home screen and runs with no signal.

- `index.html` — the whole app
- `course.json` — the course from OpenStreetMap (© OpenStreetMap contributors, ODbL), bundled so the first load needs no map server
- `sw.js` — keeps the app on the phone for offline use; bump `VERSION` whenever any file changes
- `manifest.webmanifest`, `icon-*.png` — home-screen install
- `test/regress.js` — `node test/regress.js` checks every hole's pars, distances and hazards against `test/golden.txt`

Scorecard photos are shrunk to 1800 px and kept in the phone's own storage (IndexedDB),
alongside the rounds. Nothing is uploaded anywhere; use "Share or save" to get one off the phone.

Settings → Backup writes one `trentham-backup-<date>.txt` holding every round, card photo and
setting. Restore merges by round start time: it adds what the phone is missing, never deletes, and
only takes settings from the file when the phone has no rounds. The file is outside input, so
rounds and settings are shape-checked before they are accepted.

It has to be served over HTTPS (or from localhost): phones only allow GPS and
offline storage on a secure page. Local test: `python3 -m http.server 8791 --bind 127.0.0.1`.
