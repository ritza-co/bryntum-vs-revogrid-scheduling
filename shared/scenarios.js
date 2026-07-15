// Shared scenario data for the resource-scheduling benchmark:
// Bryntum Scheduler Pro vs RevoGrid Gantt with resource view (their "Scheduler").
// Each app adapts this neutral format to its own API in src/scenarios/index.js.
//
// Dates: project starts Monday 2026-08-03. Working week Mon-Fri.
// Density rule: every interactive scenario shows 10 resources and 10+ events
// so screenshots and GIFs never look empty.

export const projectStart = '2026-08-03';

export const calendars = {
    business : {
        id          : 'business',
        name        : 'Business (Mon-Fri)',
        workingDays : [1, 2, 3, 4, 5],
        hoursPerDay : 8
    },
    tueThu : {
        id          : 'tue-thu',
        name        : 'Tue-Thu only',
        workingDays : [2, 3, 4],
        hoursPerDay : 8
    }
};

// 10 resources: enough rows to fill the viewport.
// r9 is a half-time contractor (capacity 50%), r10 is a 3-person team (capacity 300%).
export function baseResources() {
    return [
        { id : 'r1', name : 'Alex Morgan', role : 'Engineer', capacity : 100, calendar : 'business' },
        { id : 'r2', name : 'Nina Patel', role : 'Engineer', capacity : 100, calendar : 'business' },
        { id : 'r3', name : 'Ravi Chen', role : 'Designer', capacity : 100, calendar : 'business' },
        { id : 'r4', name : 'Sam Ortiz', role : 'Engineer', capacity : 100, calendar : 'business' },
        { id : 'r5', name : 'Lisa Wong', role : 'Project manager', capacity : 100, calendar : 'business' },
        { id : 'r6', name : 'Mark Reed', role : 'DevOps', capacity : 100, calendar : 'business' },
        { id : 'r7', name : 'Emma Lund', role : 'QA', capacity : 100, calendar : 'business' },
        { id : 'r8', name : 'Dave Kim', role : 'Engineer', capacity : 100, calendar : 'business' },
        { id : 'r9', name : 'Ana Silva', role : 'Designer (50%)', capacity : 50, calendar : 'business' },
        { id : 'r10', name : 'QA Team', role : 'Team of 3', capacity : 300, calendar : 'business' }
    ];
}

// Background workload so the timeline looks like a real team plan.
// Kept away from the focus events (which live on r1-r3 and early August).
const backgroundEvents = [
    { id : 'b1', name : 'Sprint planning', start : '2026-08-03', durationDays : 1 },
    { id : 'b2', name : 'CI pipeline maintenance', start : '2026-08-04', durationDays : 2 },
    { id : 'b3', name : 'Regression suite', start : '2026-08-05', durationDays : 3 },
    { id : 'b4', name : 'API contracts', start : '2026-08-03', durationDays : 3 },
    { id : 'b5', name : 'Design tokens', start : '2026-08-04', durationDays : 2 },
    { id : 'b6', name : 'Release triage', start : '2026-08-03', durationDays : 5 },
    { id : 'b7', name : 'Refactor auth', start : '2026-08-06', durationDays : 3 },
    { id : 'b8', name : 'Docs update', start : '2026-08-06', durationDays : 2 },
    { id : 'b9', name : 'Support rotation', start : '2026-08-10', durationDays : 3 },
    { id : 'b10', name : 'Perf profiling', start : '2026-08-11', durationDays : 2 }
];

const backgroundAssignments = [
    { id : 'ba1', event : 'b1', resource : 'r5', units : 100 },
    { id : 'ba2', event : 'b2', resource : 'r6', units : 100 },
    { id : 'ba3', event : 'b3', resource : 'r7', units : 100 },
    { id : 'ba4', event : 'b4', resource : 'r4', units : 100 },
    { id : 'ba5', event : 'b5', resource : 'r9', units : 50 },
    { id : 'ba6', event : 'b6', resource : 'r10', units : 200 },
    { id : 'ba7', event : 'b7', resource : 'r8', units : 100 },
    { id : 'ba8', event : 'b8', resource : 'r5', units : 100 },
    { id : 'ba9', event : 'b9', resource : 'r6', units : 100 },
    { id : 'ba10', event : 'b10', resource : 'r8', units : 100 }
];

const backgroundDependencies = [
    { id : 'bd1', from : 'b4', to : 'b7', type : 'FS', lagDays : 0 },
    { id : 'bd2', from : 'b2', to : 'b9', type : 'FS', lagDays : 0 }
];

function withBackground(scenario) {
    return {
        ...scenario,
        resources    : scenario.resources ?? baseResources(),
        events       : [...scenario.events, ...backgroundEvents],
        assignments  : [...scenario.assignments, ...backgroundAssignments],
        dependencies : [...(scenario.dependencies ?? []), ...backgroundDependencies],
        calendars    : scenario.calendars ?? [calendars.business]
    };
}

const rawScenarios = [
    {
        id     : 'resource-view',
        name   : '1. Resource-centric timeline view',
        note   : 'Events must render as interactive bars on resource rows. Drag "Prototype build" - it should move and reschedule.',
        events : [
            { id : 'f1', name : 'Kickoff workshop', start : '2026-08-03', durationDays : 2 },
            { id : 'f2', name : 'Prototype build', start : '2026-08-05', durationDays : 3 },
            { id : 'f3', name : 'Design review', start : '2026-08-10', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r2', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r3', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 },
            { id : 'fd2', from : 'f2', to : 'f3', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'multi-assignment',
        name   : '2. Assignments incl. multi-assignment',
        note   : '"Integration spike" is assigned to both Alex and Nina - it must appear on both rows. Open the editor and change an assignment.',
        events : [
            { id : 'f1', name : 'Integration spike', start : '2026-08-04', durationDays : 3 },
            { id : 'f2', name : 'Spike write-up', start : '2026-08-07', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f1', resource : 'r2', units : 100 },
            { id : 'fa3', event : 'f2', resource : 'r1', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'overallocation',
        name   : '3. Over-allocation detection (capacity/units)',
        note   : 'Each overbooking must be flagged',
        events : [
            { id : 'f1', name : 'Payment gateway', start : '2026-08-04', durationDays : 3 },
            { id : 'f2', name : 'Search indexing', start : '2026-08-05', durationDays : 3 },
            { id : 'f3', name : 'Brand illustrations', start : '2026-08-05', durationDays : 2 },
            { id : 'f4', name : 'Load test batch', start : '2026-08-04', durationDays : 4 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r1', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r9', units : 100 },
            { id : 'fa4', event : 'f4', resource : 'r10', units : 200 }
        ],
        dependencies : [],
        flags        : { warnMode : true }
    },
    {
        id        : 'resource-calendar',
        name      : '4. Per-resource calendars',
        note      : 'Ravi works Tue-Thu only. "Illustration pass" (3 working days) starts Monday Aug 3 - it must move to Tue Aug 4 and run Tue - Thu, not Mon - Wens.',
        calendars : [calendars.business, calendars.tueThu],
        resources : baseResources().map(r => (r.id === 'r3' ? { ...r, calendar : 'tue-thu' } : r)),
        events    : [
            { id : 'f1', name : 'Illustration pass', start : '2026-08-03', durationDays : 3 },
            { id : 'f2', name : 'Asset handoff', start : '2026-08-07', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r3', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r2', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'effort-driven',
        name   : '5. Effort-driven scheduling (fixed work)',
        note   : '"Data migration" is 32h of work with Alex assigned (4 days at 8h/day). Assign Nina as a second 100% resource - the vendor\'s documented effort model must hold: Bryntum FixedDuration+effortDriven keeps 32h and rebalances units to 50/50; RevoGrid\'s fixed-work formula says duration drops to 2 days everywhere, not just on the bar.',
        events : [
            { id : 'f1', name : 'Data migration', start : '2026-08-03', durationDays : 4, effortHours : 32, schedulingMode : 'fixed-work' },
            { id : 'f2', name : 'Migration checks', start : '2026-08-07', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r7', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'dependency-lag',
        name   : '6. Dependency with working-time lag',
        note   : '"Contract draft" ends Friday Aug 7. FS + 1 working-day lag means "Countersign" must start Tuesday Aug 11 (lag skips the weekend). Drag "Contract draft" one day earlier - successor must follow, preserving working-time lag.',
        events : [
            { id : 'f1', name : 'Contract draft', start : '2026-08-07', durationDays : 1 },
            { id : 'f2', name : 'Countersign', start : '2026-08-11', durationDays : 1 },
            { id : 'f3', name : 'File contract', start : '2026-08-12', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r2', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r5', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 1 },
            { id : 'fd2', from : 'f2', to : 'f3', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'constraint-conflict',
        name   : '7. Constraint conflict -> actionable resolution',
        note   : '"Board review" is pinned must-start-on Aug 12. Drag the end of "Prepare board pack" past Aug 12 - the app must name the conflict and offer resolutions.',
        events : [
            { id : 'f1', name : 'Prepare board pack', start : '2026-08-03', durationDays : 3 },
            { id : 'f2', name : 'Board review', start : '2026-08-12', durationDays : 1, constraintType : 'must-start-on', constraintDate : '2026-08-12' },
            { id : 'f3', name : 'Publish decision', start : '2026-08-13', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r5', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r5', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 },
            { id : 'fd2', from : 'f2', to : 'f3', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'cycle-detection',
        name   : '8. Dependency cycle detection',
        note   : 'Draw a dependency from "Run tests" back to "Configure ports" (A->B->A). The app must detect the cycle.',
        events : [
            { id : 'f1', name : 'Configure ports', start : '2026-08-03', durationDays : 2 },
            { id : 'f2', name : 'Run tests', start : '2026-08-05', durationDays : 2 },
            { id : 'f3', name : 'Package build', start : '2026-08-07', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r2', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r6', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 },
            { id : 'fd2', from : 'f2', to : 'f3', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'drag-reassign',
        name   : '9. Drag event to another resource',
        note   : 'Drag "Hotfix deploy" vertically from Alex\'s row to Nina\'s row. The assignment must change to Nina.',
        events : [
            { id : 'f1', name : 'Hotfix deploy', start : '2026-08-05', durationDays : 1 },
            { id : 'f2', name : 'Post-deploy watch', start : '2026-08-06', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r1', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'undo-cascade',
        name   : '10. Transactional undo of a cascade',
        note   : 'Drag "Spec" 5 working days later - the whole chain shifts. Click Undo once - every event must return to its exact original dates.',
        events : [
            { id : 'f1', name : 'Spec', start : '2026-08-03', durationDays : 2 },
            { id : 'f2', name : 'Implement', start : '2026-08-05', durationDays : 3 },
            { id : 'f3', name : 'Verify', start : '2026-08-10', durationDays : 2 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r2', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r7', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 },
            { id : 'fd2', from : 'f2', to : 'f3', type : 'FS', lagDays : 0 }
        ],
        flags : { undo : true }
    },
    {
        id     : 'utilization-view',
        name   : '11. Dedicated utilization/histogram view',
        note   : 'Same data as scenario 3. A synced per-resource load view must show utilization with a capacity line, highlight over-allocation, and update live while dragging events.',
        events : [
            { id : 'f1', name : 'Payment gateway', start : '2026-08-04', durationDays : 3 },
            { id : 'f2', name : 'Search indexing', start : '2026-08-05', durationDays : 3 },
            { id : 'f3', name : 'Brand illustrations', start : '2026-08-05', durationDays : 2 },
            { id : 'f4', name : 'Load test batch', start : '2026-08-04', durationDays : 4 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r1', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r9', units : 100 },
            { id : 'fa4', event : 'f4', resource : 'r10', units : 200 }
        ],
        dependencies : [],
        flags        : { utilization : true, warnMode : true }
    },
    {
        id     : 'manual-pinned',
        name   : '12. Manual scheduling (pinned events)',
        note   : '"Maintenance window" is manually scheduled for Aug 12. Drag "Build pipeline" later so its successor chain would collide - the pinned event must not move.',
        events : [
            { id : 'f1', name : 'Build pipeline', start : '2026-08-03', durationDays : 3 },
            { id : 'f2', name : 'Deploy staging', start : '2026-08-06', durationDays : 2 },
            { id : 'f3', name : 'Maintenance window', start : '2026-08-12', durationDays : 1, manuallyScheduled : true }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r6', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r6', units : 100 },
            { id : 'fa3', event : 'f3', resource : 'r6', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 },
            { id : 'fd2', from : 'f2', to : 'f3', type : 'FS', lagDays : 0 }
        ]
    },
    {
        id     : 'drag-snapping',
        name   : '13. Working-time drag snapping',
        note   : 'Weekends must be visualized as non-working. Drag "Pre-release audit" (Thu-Fri) one day later - it must land Mon.',
        events : [
            { id : 'f1', name : 'Pre-release audit', start : '2026-08-06', durationDays : 2 },
            { id : 'f2', name : 'Release go/no-go', start : '2026-08-10', durationDays : 1 }
        ],
        assignments : [
            { id : 'fa1', event : 'f1', resource : 'r1', units : 100 },
            { id : 'fa2', event : 'f2', resource : 'r5', units : 100 }
        ],
        dependencies : [
            { id : 'fd1', from : 'f1', to : 'f2', type : 'FS', lagDays : 0 }
        ]
    }
];

export const scenarios = rawScenarios.map(withBackground);

// Adds N working days (Mon-Fri) to an ISO date string.
export function addWorkingDays(isoDate, days) {
    // All date math in UTC: mixing a local-time Date with toISOString()
    // shifts the result a day early in timezones ahead of UTC.
    const d = new Date(`${isoDate}T00:00:00Z`);
    let remaining = days;
    while (remaining > 0) {
        d.setUTCDate(d.getUTCDate() + 1);
        const dow = d.getUTCDay();
        if (dow !== 0 && dow !== 6) remaining--;
    }
    return d.toISOString().slice(0, 10);
}
