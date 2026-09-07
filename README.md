# 2026-annual_report

**Demo URL** [Annual Report](https://unctad-infovis.github.io/2026-annual_report/)

## About

UN Trade and Development's Annual Report 2025 minisite presents the organization's
work and results during the year: the Secretary-General's foreword, UNCTAD16 and
the Geneva Consensus, key figures and milestones, technical cooperation, donors
and partners, communications, and links to publications and report chapters.

The site is a Vite + React application designed for standalone viewing and
embedding within UNCTAD's Drupal platform. Editorial content is maintained in
`src/Article.mdx`; reusable React components and hooks handle presentation and
interactions. Report styles use the `ar-` namespace, scoped design tokens and the
unique `#app-root-2026-annual_report` embed boundary.
The optional UNCTAD demo header is controlled by `src/meta.json` and is suppressed
on hostnames containing `unctad.org`.
The report does not render a site footer or newsletter form. Drupal provides its
own site footer when the report is embedded; the standalone demo ends after the
report's Explore section; the maintained React application intentionally omits the
footer contained in the original reference HTML.

## Embedding

Build and publish the files before using this snippet. The URLs below are the
intended production locations; this README does not confirm that they are live.
Resolve the deployment checks below before publishing.

```html
<link rel="stylesheet" crossorigin="anonymous"
  href="https://storage.unctad.org/2026-annual_report/assets/font/fonts.css?v=1">
<link rel="stylesheet" crossorigin="anonymous"
  href="https://storage.unctad.org/2026-annual_report/css/2026-annual_report.min.css?v=1">

<div id="app-root-2026-annual_report" class="app-root-2026-annual_report">
  Loading the annual report…
</div>
<noscript>Please enable JavaScript to view the interactive annual report.</noscript>

<script type="module" crossorigin="anonymous"
  src="https://storage.unctad.org/2026-annual_report/js/2026-annual_report.min.js?v=1"></script>
```

Use one mount container and one script instance per page. Preserve the root ID:
the React entry point uses it to find the container. The Drupal text format or
template must allow these tags and attributes; the host's Content Security Policy
and the asset server's CORS configuration must allow the required resources.
Update the `?v=` values for each release to refresh cached scripts and styles.
Changed images, videos and font binaries need their own cache invalidation policy.

### Building and publishing

Run `npm run lint`, `npm run check:html`, then `npm run build`. The HTML check
inspects rendered React/MDX for blocks inside phrasing-only elements, nested
links/buttons, and misplaced list items before a browser can repair the markup.
It is a focused nesting check, not a complete accessibility or HTML conformance audit.
The build automatically runs
`scripts/postbuild.mjs` to adjust deployment paths. Preview with `npm run preview`.

- For a standalone demo, publish the complete contents of `dist`.
- `public/demo.css` is a standalone-only static stylesheet, copied to `dist/demo.css`
  and linked by `index.html`. It controls page-level smooth scrolling and its
  reduced-motion override. Do not include it in Drupal; it is intentionally
  excluded from the embeddable report CSS bundle.
- For Drupal embedding, publish `dist/js`, `dist/css` and `dist/assets` under
  `https://storage.unctad.org/2026-annual_report/`, then insert the snippet above.
- Do not edit generated files in `dist`; each build replaces that directory.
  Source assets in `public` are retained and copied into the new build.

Font URLs in `public/assets/font/fonts.css` are relative to that stylesheet
(for example, `./inter-regular-400.ttf`). Keep the stylesheet and font binaries
together in `assets/font` so the paths remain valid in development and deployment.

### Deployment checks still required

- **Report PDF:** download and chapter links use the approved absolute URL
  `https://unctad.org/system/files/official-document/osg2026d1_en.pdf`.
  No local PDF copy is required. Chapter `#page=` fragments are preserved;
  verify the document is available and the page references match the published PDF.
- **Asset resolver:** shared asset resolution currently targets storage on UNCTAD
  URLs, local relative paths on `localhost`, and the GitHub Pages project path
  on other hosts. An alternative hosting domain requires reviewing that helper.
- Verify images, fonts, video, PDF downloads, chapter links, map interactions,
  keyboard navigation and mobile layout on the actual host page. A successful
  build does not establish that remote resources are available.

## Accessibility checks

Run `npm run check:a11y` and `npm run check:html` after content or interaction changes.
These are focused regression checks, not a WCAG certification. The report includes
named keyboard-focusable map markers and keyboard-operable donor controls, disclosure states,
combobox navigation, focus return, stable screen-reader counter values, a skip link,
focus styling and contrast improvements.

Map markers and country search update the same persistent country-details panel.
Tooltips are disabled; clearing the search restores the summary.

Remaining validation: test with NVDA/VoiceOver and mobile assistive technology,
review text over photographs/gradients, and test the actual Drupal embed.
The UNCTAD16 closing film has no supplied caption track or approved transcript.
Obtain and review those assets (including whether audio description is needed)
before claiming complete media accessibility. Do not use invented captions.

## Rights of usage

Contact Teemo Tebest.

## How to build and develop

This is a Vite + React project.

Set `GITHUB_PACKAGES_TOKEN` to a classic GitHub token with `read:packages`
before installing the published `@unctad-infovis/*` dependencies.

* `npm install`
* `npm run start`

Project should start at: http://localhost:8080

For developing please refer to `package.json`

## Files and folders

All public assets go to folder `public`.

Images referenced from React/MDX use `public/assets/img`, local videos use
`public/assets/vid`, and fonts use `public/assets/font`. CSS-only images live in
`src/assets/img` so Vite can fingerprint and bundle them. Remote video URLs remain external.

All source code goes to folder `src`.

### Editing report content and presentation

Edit report copy, figures, links and section order in `src/Article.mdx`.
Run `npm run format:article` to format the article using its parsed MDX structure
and Biome's JSX formatter. It simplifies literal attribute spreads and preserves
explicit spacing where inline content needs it. The formatter validates MDX syntax before saving;
use the rendered-content comparison below when checking editorial refactors.
Reusable layouts live in `src/jsx/components/ReportPresentation.jsx`: results cards,
publication cards, timeline items, statistics, funding bars, contributor bubbles
and explore tiles. Their content is passed from the article as props and children.
Map geometry is configured by `projectMap/createProjectMap.js`; its project data
and editorial labels are supplied through `Article.mdx`. Section components retain
their own interaction hooks and CSS.

### Styles and class names

`src/styles/index.css` is an ordered import manifest, not a monolithic stylesheet.
`foundations` contains report-scoped tokens, base typography, shared primitives,
spacing and reduced-motion rules. `components` contains feature-specific styles.
The former base/enhancement stylesheets have been replaced by these modules.

Use `ar-`-prefixed kebab-case classes for all report markup and interaction states
(for example, `ar-button-pill`, `ar-hero`, `ar-icon-arrow`, `ar-active`). Keep existing
IDs used as anchors and hooks stable. Every report selector is anchored to
`#app-root-2026-annual_report`; bare element selectors additionally use
`:where(.annual-report-app)`. Tokens are defined on the report root. Do not reorder
the import manifest without checking the cascade.
CSS comments are limited to technical explanations such as intentional lint exceptions.

The original HTML is reference material only. Maintain the report through
`src/Article.mdx`, the React components and the modular stylesheets; there is no
supported workflow for regenerating the application from that HTML.

For presentation refactors, run `node scripts/verify-presentation.mjs --capture`
before editing, then `node scripts/verify-presentation.mjs` afterwards. This compares
the server-rendered element tree, attributes and text, ignoring formatting whitespace.
It complements, but does not replace, browser interaction and visual testing.

## Packages

The following packages are used in this project by default.

### Project specific

* **@unctad-infovis/general-tools** — shared demo header and asset-path helpers
* **@unctad-infovis/unctad-icons** — hosted UNCTAD assets used directly for report labels and transitively by `general-tools`; `unctad-flags` remains transitive
* **html-react-parser**, **acorn**, **acorn-jsx**, **postcss** and **@mdx-js/mdx** — development-only importing, refactoring and verification utilities

### Build & Dev Server

* **vite** — development server with hot module replacement and production bundler, replaces webpack
* **@vitejs/plugin-react** — adds React and JSX support to Vite

### React

* **react** — UI component library
* **react-dom** — renders React components to the DOM

### Formatter & Linter

* **@biomejs/biome** — formats and lints JS, JSX and CSS files on save, replaces ESLint + Prettier

Run `npm run lint` for a read-only check (warnings fail the check), `npm run lint:fix`
for safe fixes, or `npm run format` for formatting. The local `biome.json` includes
maintained source, scripts, configuration and font CSS, excluding dependencies,
build output and the generated lockfile. MDX is validated by the Vite build, not
by this Biome check. Intentional CSS cascade exceptions have local explanations;
the recommended lint rules remain enabled. Run formatting and linting after direct
source changes.

### Minification

* **terser** — minifies the production JavaScript bundle, removes console.logs in production builds

### Project map

The approved `ProjectMap` is the only map rendered in the report. It uses
`@unctad-infovis/map-tools` with Highcharts Maps and the shared `Select` search.
Clicking a red marker or selecting a country through search displays its complete
project list in the same persistent panel. Marker selection also updates search;
clearing search restores the summary. Hover tooltips are disabled. No illustrative project photos are assigned to these
spreadsheet records.

`src/Article.mdx` imports `src/data/country-projects-2025.json` and passes it into
`ProjectMap`. The article owns the title, subtitle, summary, labels, source note,
legend and disclaimer. Counts are derived from that dataset rather than repeated
as constants. Rendering and geometry logic do not import editorial project data.

`projectMapSettings` in `Article.mdx` controls division visibility (currently on).
Division data and legend content are retained. The fixed panel supports native text selection.

The source is `countries_only_sheet1.xlsx`, sheet `Projects by country`, rows
2–108: 107 unique projects across 75 countries and territories. Country names,
division/programme codes, project titles and project numbers are preserved with
surrounding whitespace trimmed. Each record retains its source row. Country
names are matched to the map's numeric codes; explicit aliases resolve Lao PDR
(418), Democratic Republic of the Congo (180), and Venezuela (862). Accent and
apostrophe normalization is used only for matching, not for displayed names.

To verify a refreshed dataset against its source, run:
`python scripts/verify-country-project-workbook.py "<workbook path>"`
(requires `openpyxl`). Run `node scripts/verify-project-map.mjs` for geometry,
record coverage and marker-selection checks, then the regular lint,
HTML, accessibility and build commands. Updating the XLSX alone does not update
the website; update the JSON data and reconcile it before rebuilding.
Expenditure values are not displayed. The map's 107-project count follows this
workbook; the article's separate 106-national-project report figure is unchanged.

Geometry comes from the shared template's `worldmap-economies-54030.topo.json`.
Map-tools handles polygon processing, territory colour rules and mapline styles.
`topojson-client` preserves all border arcs, including dash-dotted boundaries.
The chart and geometry are built as a separate JS chunk. Project strings are
rendered as text by React in the fixed details panel. Chart instances are destroyed on
unmount. The shared package is not modified.

The retired SVG map, its photo-panel assets and one-off HTML migration scripts
have been removed. Edit report content in `src/Article.mdx` and map records in
`src/data/country-projects-2025.json`; do not regenerate the application from
its original HTML. The shared map, counter and navigation components remain.
Highcharts licensing and full assistive-technology/host-page review remain
deployment checks.

### MDX

Flagship publications use `PublicationCarousel`, with one set of cards authored in
`src/Article.mdx`. Floating arrow buttons have accessible labels supplied by the
article, respect reduced motion and update their unavailable states at either end.
Run `node scripts/verify-publication-carousel.mjs` to check its rendered structure.

* **@mdx-js/rollup** — Vite/Rollup plugin that compiles MDX files into React components
* **@mdx-js/react** — provides React context for MDX components
