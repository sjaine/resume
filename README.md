# CV

A one-page CV that reads like paper on the web and prints like it. Design rules live in `DESIGN.md`.

- Content: `data/cv.json` (stage 1). Later stages move this to a database with in-page editing.
- Download PDF: browser print → "Save as PDF" for now (print styles in `app/globals.css`).
- `phone` and other contacts marked `"printOnly": true` appear in the PDF but not on the public page.

```
npm install
npm run dev          # http://localhost:3000
npm run lint:design  # validate DESIGN.md
```
