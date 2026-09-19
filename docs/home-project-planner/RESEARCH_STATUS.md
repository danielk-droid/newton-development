# Research Status — Newton Home Project Planner

## Current conclusion

The strongest initial product architecture is a general home-project engine validated on several materially different project types, rather than a basement-only application.

## Verified Newton findings

### FAR
Newton's official FAR calculator states that homeowners can finish space within the existing building envelope without regard to FAR. Additions and other exterior/new-construction work can require FAR analysis.

### Historic
Newton's current historic-preservation workflow starts with property status. Exterior work in the four local historic districts requires Historic District Commission review; additional review can apply to landmarks, preservation restrictions, demolitions, and other qualifying properties.

### Trees
Newton requires a Tree Permit application for exterior construction, including cases where no tree is being removed. Tree Save Areas impose additional construction restrictions.

### Zoning / special permits
Newton distinguishes by-right work from work requiring zoning relief. The special-permit process can apply to additions and other development.

### ADU
Newton's current ADU information shows that ADUs have project-specific size, use, setback, height, historic, and permitting branches. This makes ADUs useful as a later stress test for the engine.

### Inspections
Newton requires a final inspection for all permits and has prerequisite rough-inspection conditions. The final workflow therefore needs dependencies rather than a flat checklist.

## Candidate V1

Research broadly across:
- basement
- bathroom
- deck
- addition

Implement only after confirming the reusable rule model.

## Reliability requirements

- Every regulatory claim must have an authoritative source.
- Source dates must be recorded.
- Conditions must remain explicit.
- Property-specific facts must be distinguished from general rules.
- Unknowns must remain unknown.
- Changes to source material must trigger review rather than silently changing production logic.
- Regression tests must cover both ordinary and edge cases.

## Current exclusions

Do not initially provide:
- structural engineering conclusions
- guaranteed permit approval
- code certification
- construction cost estimates
- contractor recommendations
- complete Massachusetts code interpretation
- automatic legal conclusions

## Product success criteria

A useful early prototype should make a homeowner say:
1. "It understood what I am trying to do."
2. "It told me what actually matters for my property."
3. "I can see where each requirement came from."
4. "I know what I need to do next."
5. "I trust it enough to come back when the project changes."

Retention should come from project utility and progress, not engagement tricks.
