# Newton Development

Newton Development is an independent public-information tracker for major development, public-building, and transportation projects in Newton, Massachusetts.

The site organizes public records into searchable project pages and an interactive map, with links back to official source records. Project locations are resolved from the City of Newton GIS datasets and are validated before generated data is published.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Leaflet for the interactive map
- GitHub Actions for automated data refresh and quality assurance

## Local development

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` in a browser.

## Quality checks

The repository includes automated checks for application structure, public-facing copy, source URLs, project IDs, event-source health, GIS coverage, coordinate provenance, and production readiness.

```bash
npm run qa
npm run validate:copy
npm run validate:data
npm run report:data-health
npm run lint
npm run build
```

## Data refresh

GitHub Actions refreshes Newton project data and official GIS coordinates on a schedule and when relevant source scripts/data change. The workflow refuses to publish incomplete GIS coverage or invalid project locations. Event-source availability is handled separately so an unavailable event source does not silently invalidate otherwise verified project and GIS data.

See [`docs/data-methodology.md`](docs/data-methodology.md) for the data and verification approach.

## Deployment

The application is designed for deployment on a standard Next.js host such as Vercel. Set `NEXT_PUBLIC_SITE_URL` to the final public site URL when deploying so generated metadata, robots instructions, and the sitemap use the correct canonical origin.

## Project status

The application is maintained as a production-oriented public-information project. Automated checks are required to pass before the site is considered ready for public release.
