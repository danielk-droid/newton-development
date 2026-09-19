# Newton Home Project Planner — Project Taxonomy

## Product scope

The product is a general homeowner project-planning system, not a basement-permit checklist.

Core promise:

> Describe what you want to change about your home. The planner identifies the relevant local requirements, dependencies, documents, unresolved questions, and next actions using verified sources.

## Initial project families

### Interior alterations
- Basement finish
- Bathroom renovation
- Kitchen renovation
- Interior remodel / reconfiguration
- Bedroom creation

### Exterior alterations
- Deck / porch
- Windows / doors
- Exterior renovation
- Shed / accessory structure
- Fence

### Building expansion
- Addition
- Dormer
- Garage conversion
- New detached structure

### Housing / use changes
- Internal ADU
- Detached ADU
- Conversion of existing accessory structure

### Site-sensitive work
- Grading / excavation
- Tree-adjacent construction
- Wetlands-sensitive work
- Floodplain-sensitive work

## Why these categories

The engine needs projects that exercise different rule types:

| Project | Primary complexity |
|---|---|
| Basement | Interior + egress + trades |
| Bathroom | Plumbing + electrical + building |
| Deck | Exterior + zoning + tree/historic |
| Addition | FAR + setbacks + structure + site |
| ADU | Use + zoning + building + site |
| Garage conversion | Use/change + egress + building |

A useful architecture must work across these categories before the product is expanded broadly.

## Candidate V1 validation set

The first implementation should use four deliberately different projects:

1. Basement finish
2. Bathroom renovation
3. Deck
4. Addition

These are a better architectural test than four variants of one project.

ADU and garage conversion remain high-value follow-on projects because they introduce additional use/zoning complexity.

## Project representation

Every project should ultimately be represented as:

- project type
- property context
- proposed scope
- triggered rules
- applicable departments
- required / potentially required actions
- dependencies
- documents
- unresolved questions
- source evidence
- confidence / certainty
- verification date
- next action

## Important design principle

A project type should not contain all of its rules in one isolated file.

Cross-cutting rules such as historic review, tree review, conservation review, permit closeout, source verification, and property identification should be reusable across projects.

Project-specific rules should only describe what is unique to that project.
