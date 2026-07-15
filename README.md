# Resource scheduling benchmark: Bryntum Scheduler Pro vs RevoGrid Gantt ("Scheduler")

There's one Vite app per product. Each app adapts the same 13 scenarios from
`shared/scenarios.js` to its own API.

## Structure

```
scheduler-benchmark/
├── shared/scenarios.js   # neutral scenario data (13 scenarios)
├── bryntum/              # Bryntum Scheduler Pro vanilla JS app
├── revogrid/             # RevoGrid Gantt + resource view vanilla JS app
└── scripts/              # scenario data verification
```

## The 13 scenarios

| # | Scenario (`shared/scenarios.js` id) | Capability tested |
|---|---|---|
| 01 | Resource-centric timeline view (`resource-view`) | Events render as interactive bars on resource rows |
| 02 | Assignments incl. multi-assignment (`multi-assignment`) | One event on two resources appears for both; assignments editable |
| 03 | Over-allocation detection (`overallocation`) | Overbooking flagged against per-resource capacity |
| 04 | Per-resource calendars (`resource-calendar`) | A resource's working days (Tue-Thu) reschedule its events |
| 05 | Effort-driven scheduling (`effort-driven`) | The vendor's documented effort model holds when assignments change |
| 06 | Dependency with working-time lag (`dependency-lag`) | Front-to-start dependency + 1 working-day lag propagates and skips the weekend |
| 07 | Constraint conflict (`constraint-conflict`) | A violated must-start-on constraint is named and resolvable |
| 08 | Cycle detection (`cycle-detection`) | A circular dependency (A->B->A) is caught and explained |
| 09 | Drag-reassign (`drag-reassign`) | Dragging an event to another resource row reassigns it |
| 10 | Transactional undo (`undo-cascade`) | One undo restores a cascaded chain exactly |
| 11 | Utilization view (`utilization-view`) | A synced per-resource load view with capacity lines |
| 12 | Manually scheduled events (`manual-pinned`) | A pinned event is unchanged by event dependency cascades around it |
| 13 | Working-time drag snapping (`drag-snapping`) | Dragged events snap to working time, skipping weekends |

## Setup

```bash
# Verify the shared scenario data
npm test

# Bryntum app (Bryntum Scheduler Pro public trial version)
cd bryntum && npm install && npm run dev   # http://localhost:5180

# RevoGrid app (Pro/Enterprise trial packages)
cd revogrid && npm install && npm run dev  # http://localhost:5181
```

### Installing the RevoGrid Pro component

Follow their [npm installation guide](https://pro.rv-grid.com/guides/installation-npm-trial) to get access to the RevoGrid Pro Gantt trial version.
