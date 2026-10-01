# CV Studio — ATS & Designed Resumes

A modern, ATS-friendly CV builder built with React + TypeScript + Vite + Tailwind CSS. Create ATS-oriented resumes or a designed resume with an optional portrait.

## Features

- **ATS-Safe Templates**: Two templates (Classic ATS, Minimal ATS) that use single-column layouts, standard headings, and plain text
- **Live Preview**: Real-time A4 page preview updates as you type
- **ATS Checker**: Built-in heuristic checker that validates your resume against 10 common ATS issues
- **PDF Export**: Print-to-PDF export with a dedicated print stylesheet (A4 layout, no UI chrome, selectable text)
- **JSON Import/Export**: Save and load your CV data as JSON files
- **Auto-Save**: localStorage persistence — your work is saved automatically
- **Section Reordering**: Reorder and toggle visibility of CV sections
- **Sample Data**: Pre-loaded student and junior developer CV samples; first-time visitors choose between a blank CV, the sample or a JSON import
- **Undo/Redo**: Toolbar buttons and Ctrl+Z / Ctrl+Y (outside text fields); removing entries, loading samples, imports and AI edits show an Undo notification

## Designed resumes and photos

1. Choose **Designed resume** in Resume style or the template menu. The current CV is converted instantly using the same content, including imported ATS JSON files.
2. Choose a teal, navy, burgundy or graphite accent.
3. Upload an optional JPG, PNG or WebP portrait (up to 10 MB). Adjust its vertical position or remove it. Images are resized locally to a maximum of 800 pixels and stored with the CV.
4. Export PDF to print the styled layout with selectable text and the photo. Enable background graphics if your browser omits the sidebar shading.
5. Switch back to Classic ATS or Minimal ATS whenever needed. The portrait remains saved but is not rendered in ATS layouts.

The designed layout puts the photo, contact details, skills, certifications and languages in a left sidebar, with the name and title at the top of the main column (no full-width header, so content starts higher on the page). Section order applies within each column; section visibility and English/French headings remain supported. It is intended for direct sharing rather than automated application portals. This is a styled template, not a freeform canvas editor.

Auto-save and JSON exports include the portrait. Photos are excluded from AI assistant requests. If browser storage is full or unavailable, the app shows an alert so you can export a JSON backup. The responsive preview shows the complete document; PDF printing determines final A4 page breaks.

## Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How to Export an ATS-Safe PDF

1. Click **Export PDF** (or press Ctrl+P / Cmd+P)
2. In the print dialog, select **"Save as PDF"** as the destination
3. Set paper size to **A4**
4. Leave margins on **Default** (the CV sets its own page margins, so every page has the same top and bottom space)
5. **"Background graphics"** can stay off for the ATS templates, which have no shading; turn it **on** for the designed resume so the sidebar prints
6. Save

The app shows these settings in a notification when you click Export PDF.

The exported PDF will contain:
- Selectable, copy-pasteable text (not images)
- Proper A4 layout with margins
- No page breaks inside entries (CSS `break-inside: avoid`)

## ATS Rules Enforced

| Rule | Enforced |
|------|----------|
| Single-column layout | Yes |
| No icons, images, charts | Yes |
| No tables or columns | Yes |
| Standard section headings | Yes |
| Plain text dates/locations | Yes |
| System/Arial fonts | Yes |
| Simple bullets (•) | Yes |
| Selectable text in PDF | Yes |

## What to Avoid

- Do **not** add emojis or unusual Unicode characters
- Do **not** use more than 6 bullets per job entry
- Do **not** skip dates on work experience
- Do **not** leave the summary section empty
- Do **not** make your name excessively long

## Template Rules

The two ATS templates:
- Use single-column layout
- Use Arial/system fonts
- Render skills as plain text lists (not tags/badges)
- Keep all content as real, selectable text

### Classic ATS
- ALL CAPS section headings
- Thin horizontal line separators
- Centered name/contact header

### Minimal ATS
- Bold title-case headings
- No separator lines
- Left-aligned header

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- localStorage for persistence
- `window.print()` for PDF export

## Project Structure

```
src/
  types.ts                    # TypeScript data model
  App.tsx                     # Main layout
  main.tsx                    # Entry point
  index.css                   # Tailwind + CV styles + print stylesheet
  context/
    CVContext.tsx              # React context + reducer + localStorage
  data/
    sampleData.ts             # Student + Junior Dev sample CVs
    uuid.ts                   # UUID generator
  components/
    Toolbar.tsx               # Top bar (template, export, samples)
    editor/
      Editor.tsx              # Editor container
      PersonalInfoEditor.tsx
      SummaryEditor.tsx
      ExperienceEditor.tsx
      EducationEditor.tsx
      SkillsEditor.tsx
      CertificationsEditor.tsx
      LanguagesEditor.tsx
      ExtracurricularsEditor.tsx
      SectionReorder.tsx
    preview/
      Preview.tsx             # A4 preview container
      TemplateRenderer.tsx    # Template switch
      templates/
        ClassicTemplate.tsx   # Classic ATS template
        MinimalTemplate.tsx   # Minimal ATS template
    ats/
      ATSChecker.tsx          # ATS compatibility checker
    export/
      ExportControls.tsx      # PDF + JSON export/import
```

## Hosted AI server (Cloudflare Worker)

The live site's AI assistant runs through a free Cloudflare Worker in `worker/`, deployed at https://cv-studio-ai.cvstudio.workers.dev (set in `.env.production`). It keeps the Gemini API key as a Cloudflare secret, so visitors don't need their own key; they can still switch to their own key in the assistant panel.

- Only requests from the site's own origins (`ALLOWED_ORIGINS` in `worker/wrangler.toml`) are accepted, with size limits and 10 requests per minute per visitor.
- Only the free-tier Flash models are used (`ALLOWED_MODELS`). The free Gemini quota is shared by all visitors.
- Deploy code changes: `cd worker && npm install && npx wrangler deploy`
- Replace the Gemini key: `cd worker && npx wrangler secret put GEMINI_API_KEY`
- Watch live logs: `cd worker && npx wrangler tail`

For local development you can instead run the Express proxy (`cd server && npm run dev`) or use your own key.

## Regression checks

Run `npm run build` and `npm run lint`. For the browser regression check, run `npx playwright install chromium`, start `npm run dev` in another terminal, then run `npm run test:e2e`. You can set `BROWSER_CHANNEL=msedge` to use an installed Edge browser, or `TEST_URL` for another local server URL. Screenshots and a PDF are written to the ignored `test-results/` directory. The check covers conversion without content loss, photo upload/removal, persistence, invalid files, ATS switching, PDF image loading and bullet markers, JSON round-trips, legacy JSON migration, and mobile preview.
