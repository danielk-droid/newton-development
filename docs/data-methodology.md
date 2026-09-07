# Newton Development data methodology

## Purpose

Newton Development is an independent public-information tool. Its goal is to make Newton development records easier to understand without replacing the underlying public record.

## Source hierarchy

1. City of Newton records and project pages (`newtonma.gov` / approved City subdomains)
2. Newton Public Schools official records (`newton.k12.ma.us`) for school projects
3. Official Newton permitting/application portals linked by City pages
4. City of Newton GIS data for map/location information

General web search results are not an input to the automated project-event collector or the project-location pipeline.

## Event collection rules

- The collector starts from a fixed allowlist of official City source pages.
- It only follows HTTPS links on approved City hosts.
- Redirects outside the approved hosts are rejected.
- A document must contain project-specific matching evidence before it can produce an event.
- Numeric street addresses are the strongest project match.
- Multi-street projects require multiple matching street names when no numeric address is available.
- Street-only projects require additional project-name evidence rather than matching the street name alone.
- Generic occurrences of “Newton” never identify a project.
- A document can legitimately produce events for multiple projects when it contains evidence for each project.
- Source failures are recorded with timestamps and stop the refresh rather than silently publishing a partial refresh.

## Map locations

Project coordinates are generated during the automated refresh from the City of Newton GIS `Addresses` and `Street Center Lines` layers. Numeric project addresses use official address points when available. Street-only project locations use the official street centerline geometry. Projects without a defensible official GIS match remain explicitly unresolved rather than receiving a guessed coordinate.

## Provenance

Every automatically discovered event retains its source document URL. Newly discovered events also retain the collection timestamp and the project-match evidence used to associate the document with the project.

Project highlights require an explicit source URL. Data validation rejects highlights that reference unknown projects or URLs outside the approved authoritative source hosts.

GIS coordinate records retain the official GIS source, matching method, matched address/street, and collection timestamp.

## Automated integrity controls

The refresh pipeline validates project references, source hosts, HTTPS URLs, event dates, duplicate event records, event provenance, source-health timestamps, GIS coordinate bounds, GIS project references, and generated-data presence before a production build can proceed.

## Limitations

- City records can be corrected, moved, archived, or removed after publication.
- A source being reachable does not mean every record on that source is complete or current.
- City GIS itself states that its map data are provided without warranty and may not be complete or current. It is used here specifically for map location data, not as evidence of project approval or legal status.
- The application summarizes public records; it does not make legal, zoning, permitting, financial, or engineering determinations.
- For consequential decisions, users should review the linked primary record and, where appropriate, confirm the current status with the City or the responsible agency.
