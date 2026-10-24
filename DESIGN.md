---
version: alpha
name: Jay Shin CV
description: A one-page CV that reads like a sheet of paper on the web and prints like one.
colors:
  background: "#FFFFFF"
  surface: "#F4F3F0"
  surface-strong: "#E6E5E0"
  on-background: "#1C1C1A"
  on-surface-muted: "#6F6E69"
  outline: "#DCDBD6"
  outline-strong: "#9E9D97"
  primary: "#1C1C1A"
  on-primary: "#FFFFFF"
  primary-hover: "#3A3A37"
  accent: "#2F5BD3"
  warning: "#B4561C"
  on-warning: "#FFFFFF"
  logo-tile: "#000000"
typography:
  name:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.01em
  title:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
  data:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: tnum
  micro:
    fontFamily: Geist Mono
    fontSize: 9.5px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.04em
rounded:
  xs: 3px
  sm: 6px
  md: 10px
  lg: 14px
  full: 999px
spacing:
  xxs: 4px
  xs: 6px
  sm: 10px
  md: 14px
  lg: 20px
  xl: 28px
  xxl: 48px
components:
  logo:
    backgroundColor: "{colors.logo-tile}"
    rounded: 5px
    size: 30px
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.body}"
    width: 640px
  header-name:
    textColor: "{colors.on-background}"
    typography: "{typography.name}"
  header-role:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body}"
  section-label:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label}"
  entry-date:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.data}"
    width: 144px
  entry-title:
    textColor: "{colors.on-background}"
    typography: "{typography.title}"
  entry-meta:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body}"
  entry-body:
    textColor: "{colors.on-background}"
    typography: "{typography.body}"
  link:
    textColor: "{colors.on-background}"
    typography: "{typography.body}"
  link-underline:
    backgroundColor: "{colors.outline-strong}"
    height: 1px
  link-hover:
    textColor: "{colors.on-surface-muted}"
  focus-ring:
    backgroundColor: "{colors.accent}"
    size: 2px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 0 16px
    height: 36px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 0 16px
    height: 36px
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  button-text:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 0 10px
    height: 32px
  button-text-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
  button-icon:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.full}"
    size: 36px
  button-icon-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
  button-small:
    typography: "{typography.caption}"
    height: 28px
    padding: 0 12px
  button-danger:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-warning}"
  input-pill:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 10px
    height: 28px
  segmented:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: 2px
  segmented-option:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 12px
    height: 28px
  segmented-option-selected:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
  editable-hover:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xs}"
  editable-active:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xs}"
  override-mark:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.on-background}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
  edit-bar:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.full}"
    padding: 4px
  status-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: 0 8px
    height: 20px
  suggestion-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 14px
  suggestion-before:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body}"
  suggestion-reason:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.caption}"
  jd-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 14px
---

# Jay Shin CV

## Overview

A CV that behaves like a sheet of paper. The page is one quiet column of text: no hero, no cards, no illustration. Hierarchy comes from weight and grey, never from size jumps or color. Dates and figures read like a ledger in Geist Mono. The web page and the downloaded PDF are the same document; if something would look wrong printed, it does not belong on the screen either.

This file shares its tokens with the Poster Wall (`posters.jaineysshin.com`) so every side project reads as one family: warm paper whites, ink-black primary, one accent blue kept for focus only, Geist and Geist Mono.

The page has three states, all on the same URL and layout:

- **Read** — what visitors and recruiters see.
- **Edit** — the same page after the admin logs in; text becomes editable in place.
- **Tailor** — a side panel for pasting a job description and reviewing suggested edits.

## Colors

- **background / surface / surface-strong** are warm whites with a slight yellow bias, like paper. Never pure cool grey.
- **on-background** is ink for all primary text. **on-surface-muted** is the one secondary grey for dates, locations, section labels and meta. There is no third text grey.
- **primary** is ink. It fills the single most important action in view: Download PDF when reading, Publish when editing.
- **accent** is reserved for keyboard focus rings and the caret line of the field being edited. It is never a link color, never a fill.
- **warning** marks an armed delete and a failed save. Nothing else.
- **logo-tile** is pure black in both themes, matching the portfolio site.

Dark mode mirrors every role: background `#161615`, surface `#22221F`, surface-strong `#2E2E2A`, on-background `#ECEBE6`, on-surface-muted `#9A9993`, outline `#2E2E2B`, outline-strong `#5B5A55`, primary `#ECEBE6`, on-primary `#161615`, primary-hover `#D4D3CD`, accent `#7D9BFF`, warning `#E08A52`, on-warning `#161615`. Print always uses the light values.

## Typography

One family, two cuts. Geist for words, Geist Mono for dates, years and anything that is a measurement. Numbers use tabular figures so date columns align.

- **name** (15px / 500) is the largest text on the page. There is no display size; the content is the headline.
- **title** (14px / 500) is a role, school or project name — the same size as body, set apart only by weight.
- **body** (14px / 400, line-height 1.55) is for descriptions. Keep lines under ~70 characters.
- **label** (13px / 500) is used for section labels in **on-surface-muted**, sentence case ("Experience", not "EXPERIENCE").
- **data** (Geist Mono 12px) is used for dates and durations: `2025 — 2026`, `Sep 2025 — Apr 2026`. Use an em dash with spaces; write "Now" for current roles.
- **micro** (Geist Mono 9.5px, uppercase, tracked) is UI-only: status pills and override marks. It never appears in the printed CV.

Print sizes: name 13pt, body and title 10pt, data 9pt. Same weights.

## Layout

**Page frame.** A single column, `page.width` 640px, centred, with a 16px side gutter on phones. The top padding is 96px on desktop and 48px on phones, so the CV starts like a document, not a landing page.

**Chrome.** Only two things sit outside the column:

- The **logo** sits fixed in the top-left corner (16px from both edges, 20px on desktop): a 30px black tile with the white star mark, slowly rotating (40s per turn, with a gentle 0.9 → 0.95 scale breath), linking to `jaineysshin.com`. With reduced motion turned on, it stays still. It is hidden in print.
- **Download PDF** sits fixed in the top-right corner as a `button-small` `button-primary`. On phones it collapses to a `button-icon` with a download glyph.

**Header block.** Name on line one, role ("Design Engineer") on line two in muted, location and links on line three in muted. No photo by default. Then `spacing.xxl` (48px) before the first section.

**Sections.** Each section is a label followed by entries, with `spacing.xxl` between sections and `spacing.xl` (28px) between entries. Sections are separated by space only — no rules, no boxes. The default order is About, Experience, Projects, Education, Skills, Links.

**Entries.** The signature Read.cv grid: a fixed 144px left column holding `entry-date` (wide enough for `Sep 2025 — Apr 2026` on one line), and a fluid right column holding `entry-title`, then `entry-meta` (company · location), then `entry-body`. The column gap is `spacing.lg` (20px). Under 560px the date moves above the title, still in Geist Mono and muted.

- **About** is plain body text with no date column; it spans the right column only, so its left edge aligns with every other entry.
- **Skills** are comma-separated body text grouped by one muted word ("Design", "Code", "Tools"), not tags or chips.
- **Links** are a two-column list: service on the left in muted, handle on the right as a link.

**Footer.** A single line far below the last section: "Last updated" with a date in `data`, and the `button-text` Admin on the right. Nothing else.

## Elevation & Depth

None. The page is flat paper. The only shadow allowed is on the floating **edit-bar** in Edit mode (`0 1px 2px rgba(20,20,18,0.08), 0 8px 24px -8px rgba(20,20,18,0.18)`), because it floats above the document rather than being part of it.

## Shapes

Controls are pills (`rounded.full`). Editable fields use `rounded.xs` (3px) so a hovered line still reads as text, not a card. Suggestion cards use `rounded.md` (10px). The logo tile uses 5px, matching the portfolio. The document itself has no corners because it has no container.

## Components

**Read mode**

- **link** is ink-colored with a 1px underline in **outline-strong**, offset 3px. On hover the text moves to muted and the underline to ink. Links are never blue.
- **Download PDF** is the one `button-primary` in Read mode. While the file is being prepared it shows "Preparing…" and stays the same width.

**Admin login**

- There is no login page and no login modal. The footer's `button-text` "Admin" turns, in place, into an `input-pill` password field with a `button-small` `button-primary` "Log in" beside it, the same pattern as the Poster Wall. `⌘ .` (or `Ctrl .`) focuses it from anywhere.
- A wrong password shakes the field once (4px, spring) and shows "Wrong password." in **warning** caption text beside it. Escape collapses it back to "Admin".

**Edit mode**

- `button-text`, `button-icon` and unselected `segmented-option`s have no fill of their own; they sit on **background**, which is the colour the contrast check uses (muted on background is 5.1:1, on surface 4.6:1).
- Every text node in the document becomes editable in place. On hover a field gets **editable-hover** (surface background, padding 2px 4px with a negative margin so text does not shift). When focused it gets **editable-active** with a 2px accent caret line on the left. Nothing else on the page moves.
- Empty fields show their placeholder ("Add a role") in muted text so the layout is visible before content exists.
- Each entry shows a drag handle (6-dot glyph, muted) in the gutter left of the date column on hover, and a `button-icon` "⋯" on the right for Duplicate, Hide and Remove. Remove needs two clicks: the first arms it as `button-danger`, the second deletes.
- A quiet `button-text` "+ Add entry" sits at the end of each section, visible only in Edit mode.
- **edit-bar** floats at the bottom centre (24px from the bottom edge): a `status-pill` (`DRAFT` or `PUBLISHED`, plus a "Saved" caption that fades in after each autosave), a **segmented** version switcher, `button-text` "Tailor", `button-text` "Log out" and the `button-primary` "Publish". Publish is the only primary while editing; Download PDF is hidden in Edit mode.

**Versions**

- The **segmented** control in the edit-bar switches between Base and named variants (e.g. "Vercel"). A variant shows the Base content except where it was changed.
- A changed field in a variant carries an **override-mark** — a `micro` tag reading `EDITED` on **surface-strong** — after its text, and a "Reset to base" action in its "⋯" menu. Hidden sections in a variant appear in Edit mode at 40% opacity with a `HIDDEN` mark, and not at all in Read mode or the PDF.

**Tailor panel**

- Opens from the right as a 400px panel that pushes the document left (on phones it covers the page as a full sheet). It never overlays the CV text, so a suggestion and the line it changes can be seen side by side.
- Step one is **jd-input**: a tall textarea with a 1px outline border and the placeholder "Paste a job description". A `button-primary` "Review" is the only primary in the panel.
- Results begin with one short summary paragraph in body text, then a list of **suggestion-card**s. Each card holds the section name in `label`, the current line as **suggestion-before** (muted, struck through), the proposed line in body ink, the reason as **suggestion-reason**, and a row of `button-small` actions: "Apply", "Edit", "Skip".
- Hovering a card highlights its target line in the document with **editable-hover**.
- A suggestion that is not backed by anything already in the CV is never written as a fact. It is phrased as a question ("Have you used Storybook? If so, add it to Skills.") and has only "Add" and "Skip" actions.
- "Save as variant" sits at the bottom of the panel as `button-secondary`; it asks for a variant name in an `input-pill` inline.

## Motion

Motion is small and physical, using `motion/react` springs (stiffness 280, damping 32), shared with the Poster Wall. Mode changes (Read → Edit) only fade in the edit affordances over the same layout; the text never moves. Entries reorder with a layout spring. The Tailor panel slides in with the same spring. No fixed-duration CSS transitions on anything but color. With reduced motion turned on, every change is instant.

## Print

The PDF is generated from the Read mode of the chosen version, printed as US Letter with 0.5in top/bottom and 0.6in side margins.

- Hide the logo, Download PDF, the footer Admin control and every Edit or Tailor element.
- Keep the 144px date column (1.4in) so the PDF matches the web page.
- Links print as ink text with their bare URL in muted after the label ("Portfolio — jaineysshin.com").
- On paper `entry-title` and `entry-meta` share one line (meta follows the title, muted), so a full CV fits on one page.
- Never split an entry across pages (`break-inside: avoid`); a section label never ends a page alone.
- All text stays selectable text, so applicant tracking systems can read it.

## Do's and Don'ts

- Do let space, weight and one grey carry the hierarchy.
- Do keep dates in Geist Mono with tabular figures, right column aligned.
- Do keep exactly one `button-primary` in view at a time.
- Do make the screen and the PDF look like the same document.
- Don't add cards, boxes, dividers, gradients, icons beside headings, skill bars or rating dots.
- Don't use color for emphasis, and never use accent blue for links or fills.
- Don't use a serif face, a beige or terracotta palette, or large rounded panels.
- Don't show a login page, modal or visible "Sign in" button in Read mode.
- Don't let the Tailor panel invent experience; anything unsupported is a question, not an edit.
