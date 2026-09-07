# Newton Development data methodology

## Purpose

Newton Development is an independent public-information tool. Its goal is to make Newton development records easier to understand without replacing the underlying public record.

## Source hierarchy

1. City of Newton records and project pages (`newtonma.gov` / approved City subdomains)
2. Newton Public Schools official records (`newton.k12.ma.us`) for school projects
3. Official Newton permitting/application portals linked by City pages
4. City GIS data for map/location information

General web search results are not an input to the automated project-event collector.

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
- A source failure does not silently become a verified event.
- The update process refuses to publish when every configured official event source fails.

## Provenance

Every automatically discovered event retains its source document URL. Newly discovered events also retain the collection timestamp and the project-match evidence used to associate the document with the project.

Project highlights require an explicit source URL. Data validation rejects highlights that reference unknown projects or URLs outside the approved authoritative source hosts.

## Limitations

- City records can be corrected, moved, archived, or removed after publication.
- A source being reachable does not mean every record on that source is complete or current.
- The application summarizes public records; it does not make legal, zoning, permitting, financial, or engineering determinations.
- For consequential decisions, users should review the linked primary record and, where appropriate, confirm the current status with the City or the responsible agency.
