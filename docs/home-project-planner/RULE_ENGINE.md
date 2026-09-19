# Rule Engine Architecture

## Goal

Convert a homeowner's natural-language project into a sourced, conditional workflow.

Pipeline:

1. Understand project
2. Identify property
3. Ask only questions that can change the result
4. Load applicable rules
5. Evaluate conditions
6. Build dependencies
7. Attach evidence
8. Generate human-readable plan
9. Identify uncertainty
10. Produce next action

## Rule states

- VERIFIED — directly supported by an authoritative source and applicable to the known facts.
- CONDITIONAL — authoritative rule exists, but applicability depends on facts not yet established.
- NEEDS_CONFIRMATION — the system cannot safely resolve applicability from available data.
- NOT_APPLICABLE — known facts rule it out.
- OUT_OF_SCOPE — requires professional/code analysis the product does not claim to perform.

## Source hierarchy

1. Newton ordinance / official regulatory material
2. Massachusetts statute, regulation, building-code material, or official interpretation
3. Newton department guidance
4. Official Newton applications/forms/checklists
5. Official GIS/property data
6. Secondary sources only for discovery, never as sole authority for a regulatory conclusion

## Rule structure

Each rule should contain:

- stable ID
- project families
- jurisdiction
- conditions
- result
- dependencies
- authoritative sources
- last verified date
- review status

## Cross-cutting rule families

### Property
- address validation
- parcel/property context
- zoning district
- historic status
- conservation/wetland status
- floodplain status
- tree-sensitive conditions
- existing permits

### Planning / zoning
- use
- setbacks
- lot coverage
- FAR
- height
- nonconformity
- special permit / variance possibility

### Building
- building permit
- occupancy/use
- structural scope
- egress
- energy requirements

### Trades
- electrical
- plumbing
- gas
- HVAC where applicable

### Environmental / site
- trees
- wetlands
- floodplain
- grading / excavation

### Historic
- local historic district
- landmark
- preservation restriction
- age / National Register-related review

### Closeout
- rough inspections
- trade finals
- department signoffs
- building final
- permit closure

## Reliability rule

The model must never convert missing evidence into a confident requirement.

Bad:
"Your project needs a Tree Permit."

Better:
"Because this project includes exterior construction, Newton currently requires a Tree Permit application before exterior work begins. Source: Newton Tree Preservation Ordinance."

If a property-specific condition cannot be verified:
"Potentially applicable — verify property status before proceeding."

## AI boundary

AI may:
- interpret the user's description
- select relevant questions
- retrieve applicable rules
- explain source-backed requirements
- organize dependencies
- summarize the plan

AI must not:
- certify code compliance
- certify structural safety
- guarantee approval
- invent requirements
- substitute for engineering
- claim an unresolved property condition is resolved

## Regression requirement

Every rule added must have at least one positive and one negative/conditional scenario where practical.

A rule change should be tested against the full scenario suite before being treated as production-ready.
