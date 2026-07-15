// Verifies the shared scenario data before either app consumes it.
// Run from the repo root: npm test
import { scenarios } from '../shared/scenarios.js';
import assert from 'node:assert/strict';

const EXPECTED_COUNT = 13;

assert.equal(scenarios.length, EXPECTED_COUNT, `expected ${EXPECTED_COUNT} scenarios, got ${scenarios.length}`);

const ids = new Set();
for (const sc of scenarios) {
    assert.ok(!ids.has(sc.id), `duplicate scenario id ${sc.id}`);
    ids.add(sc.id);

    assert.ok(sc.name && sc.note, `${sc.id}: needs name and note`);

    // Visual density rule: 10 resources, 10+ events so screenshots never look empty
    assert.ok(sc.resources.length >= 10, `${sc.id}: needs >= 10 resources, has ${sc.resources.length}`);
    assert.ok(sc.events.length >= 10, `${sc.id}: needs >= 10 events, has ${sc.events.length}`);

    const eventIds = new Set(sc.events.map(e => e.id));
    const resourceIds = new Set(sc.resources.map(r => r.id));

    for (const a of sc.assignments) {
        assert.ok(eventIds.has(a.event), `${sc.id}: assignment ${a.id} references missing event ${a.event}`);
        assert.ok(resourceIds.has(a.resource), `${sc.id}: assignment ${a.id} references missing resource ${a.resource}`);
    }
    for (const d of sc.dependencies) {
        assert.ok(eventIds.has(d.from), `${sc.id}: dependency ${d.id} references missing event ${d.from}`);
        assert.ok(eventIds.has(d.to), `${sc.id}: dependency ${d.id} references missing event ${d.to}`);
        assert.ok(['FS', 'SS', 'FF', 'SF'].includes(d.type), `${sc.id}: dependency ${d.id} has invalid type ${d.type}`);
    }

    // Every event is assigned to someone - a resource-scheduling benchmark has no unassigned bars
    for (const e of sc.events) {
        assert.ok(sc.assignments.some(a => a.event === e.id), `${sc.id}: event ${e.id} has no assignment`);
    }

    const calendarIds = new Set((sc.calendars ?? []).map(c => c.id));
    for (const r of sc.resources) {
        assert.ok(calendarIds.has(r.calendar), `${sc.id}: resource ${r.id} references missing calendar ${r.calendar}`);
    }
}

// Scenario-specific invariants
const constraintSc = scenarios.find(s => s.id === 'constraint-conflict');
assert.ok(constraintSc.events.some(e => e.constraintType === 'must-start-on'), 'constraint-conflict: needs a must-start-on event');

const manualSc = scenarios.find(s => s.id === 'manual-pinned');
assert.ok(manualSc.events.some(e => e.manuallyScheduled), 'manual-pinned: needs a manually scheduled event');

const effortSc = scenarios.find(s => s.id === 'effort-driven');
assert.ok(effortSc.events.some(e => e.schedulingMode === 'fixed-work' && e.effortHours), 'effort-driven: needs a fixed-work event with effortHours');

const lagSc = scenarios.find(s => s.id === 'dependency-lag');
assert.ok(lagSc.dependencies.some(d => d.lagDays > 0), 'dependency-lag: needs a lagged dependency');

const overSc = scenarios.find(s => s.id === 'overallocation');
assert.ok(overSc.resources.some(r => r.capacity === 300), 'overallocation: needs a 300% capacity team');
assert.ok(overSc.resources.some(r => r.capacity === 50), 'overallocation: needs a 50% capacity resource');

console.log(`OK: ${scenarios.length} scenarios verified.`);
