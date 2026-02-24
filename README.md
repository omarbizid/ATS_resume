# ATS CV Builder

A modern, ATS-friendly CV builder built with React + TypeScript + Vite + Tailwind CSS. Create resumes that reliably pass Applicant Tracking Systems (ATS).

## Features

- **ATS-Safe Templates**: Two templates (Classic ATS, Minimal ATS) that use single-column layouts, standard headings, and plain text
- **Live Preview**: Real-time A4 page preview updates as you type
- **ATS Checker**: Built-in heuristic checker that validates your resume against 10 common ATS issues
- **PDF Export**: Print-to-PDF export with a dedicated print stylesheet (A4 layout, no UI chrome, selectable text)
- **JSON Import/Export**: Save and load your CV data as JSON files
- **Auto-Save**: localStorage persistence — your work is saved automatically
- **Section Reordering**: Reorder and toggle visibility of CV sections
- **Sample Data**: Pre-loaded student and junior developer CV samples

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
4. Set margins to **None** or **Minimum**
5. Ensure **"Background graphics"** is **unchecked**
6. Save

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

Templates only change typography and spacing. Both templates:
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
