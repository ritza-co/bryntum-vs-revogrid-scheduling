import { defineCustomElements } from '@revolist/revogrid/loader';
import { GanttPlugin, defineGanttToolbar, DEFAULT_TIMELINE_ZOOM_LEVELS, createDefaultTaskTableColumn } from '@revolist/rv-enterprise-trial';
import '@revolist/rv-pro-trial/dist/rv-pro-trial.css';
import '@revolist/rv-enterprise-trial/dist/rv-enterprise-trial.css';
import { scenarios, calendars as sharedCalendars, addWorkingDays } from '../shared/scenarios.js';
import './style.css';

defineCustomElements();

const DEP_TYPE = {
    FS : 'finish-to-start',
    SS : 'start-to-start',
    FF : 'finish-to-finish',
    SF : 'start-to-finish'
};

// Shared calendar -> RevoGrid calendar (field names from
// pro.rv-grid.com/guides/gantt/resources/resources-and-assignments/ and the
// earlier comparison app).
function adaptCalendar(cal) {
    return {
        id          : cal.id,
        name        : cal.name,
        timeZone    : 'UTC',
        workingDays : cal.workingDays,
        holidays    : [],
        hoursPerDay : cal.hoursPerDay
    };
}

function adaptTask(e, resourceByEvent) {
    return {
        projectId       : 'p1',
        parentId        : null,
        wbsCode         : String(e.id),
        type            : 'task',
        status          : 'not-started',
        progressPercent : 0,
        isCritical      : false,
        id              : e.id,
        name            : e.name,
        startDate       : e.start,
        endDate         : addWorkingDays(e.start, Math.max(0, e.durationDays - 1)),
        // The resources guide's task shape has `durationDays`, but the shipped
        // GanttTaskSourceBase type (rv-enterprise-trial 2.2.13) only reads
        // `duration`. Pass it explicitly so the engine never derives duration
        // from the start/end diff - a zero diff turns a task into a milestone
        // diamond (their bundle treats internal durationDays === 0 as milestone).
        duration        : e.durationDays,
        calendarId      : 'business',
        tags            : [],
        // Their manual-scheduling guide documents `taskMode: 'manual'`, but the
        // shipped TaskEntity type (rv-enterprise-trial 2.2.13) has no such field -
        // it uses `manuallyScheduled: boolean`. Docs/package mismatch.
        ...(e.manuallyScheduled ? { manuallyScheduled : true } : {}),
        // effortMode per pro.rv-grid.com/guides/gantt/scheduling/effort-modes/
        ...(e.schedulingMode === 'fixed-work' ? { effortMode : 'fixed-work', workHours : e.effortHours } : {}),
        ...(e.constraintType ? { constraintType : e.constraintType, constraintDate : e.constraintDate } : {}),
        // Convenience column so assignments are visible in task view
        assignedTo      : resourceByEvent[e.id] ?? ''
    };
}

function adaptScenario(sc) {
    const resourceNames = Object.fromEntries(sc.resources.map(r => [r.id, r.name]));
    const resourceByEvent = {};
    for (const a of sc.assignments) {
        resourceByEvent[a.event] = [resourceByEvent[a.event], resourceNames[a.resource]].filter(Boolean).join(', ');
    }

    return {
        tasks     : sc.events.map(e => adaptTask(e, resourceByEvent)),
        calendars : (sc.calendars ?? [sharedCalendars.business]).map(adaptCalendar),
        resources : sc.resources.map(r => ({
            id                 : r.id,
            name               : r.name,
            role               : r.role,
            calendarId         : r.calendar,
            allocationCapacity : r.capacity
        })),
        assignments : sc.assignments.map(a => ({
            id              : a.id,
            taskId          : a.event,
            resourceId      : a.resource,
            allocationUnits : a.units
        })),
        dependencies : sc.dependencies.map(d => ({
            id                : d.id,
            predecessorTaskId : d.from,
            successorTaskId   : d.to,
            type              : DEP_TYPE[d.type],
            lagDays           : d.lagDays
        }))
    };
}

// Instrumentation for benchmark verification (not part of the comparison)
window.scenarios = scenarios;
window.adaptScenario = adaptScenario;

const scenarioSelect = document.getElementById('scenario');
const statusEl = document.getElementById('status');
const controlsEl = document.getElementById('controls');
const gridHost = document.getElementById('grid-host');
const toolbarEl = document.getElementById('toolbar');

let grid = null;
let currentAdapted = null;
let resourceViewOn = false;

for (const sc of scenarios) {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.name;
    scenarioSelect.appendChild(opt);
}

function setStatus(text) {
    statusEl.textContent = text;
}

// Scenario 1 is the hero comparison shot: Bryntum shows a fixed one-week
// range stretched across the viewport. RevoGrid has no timeline start/end
// config (the range is derived from task dates), so widen the day tick of
// the built-in 'day-week' zoom level until ~8 day columns fill the timeline
// area (grid columns occupy ~510px).
function heroZoom() {
    const timelineWidth = Math.max(600, gridHost.clientWidth - 510);
    const tickWidth = Math.round(timelineWidth / 8);
    return {
        levels         : DEFAULT_TIMELINE_ZOOM_LEVELS.map(l => (l.id === 'day-week' ? { ...l, tickWidth } : l)),
        defaultLevelId : 'day-week'
    };
}

function ganttConfig(sc, { resourcePlanning = false } = {}) {
    return {
        id                : 'p1',
        name              : 'Benchmark project',
        version           : '1.0.0',
        currency          : 'USD',
        timeZone          : 'UTC',
        primaryCalendarId : 'business',
        updatedAt         : '2026-08-01T00:00:00.000Z',
        zoomPreset        : 'week',
        ...(sc.id === 'resource-view' ? { zoom : heroZoom() } : {}),
        scheduling        : {
            excludeHolidaysFromDuration : true,
            // Documented flag for working-day dependency offsets
            // (pro.rv-grid.com/guides/gantt/scheduling/calendars/). Observed
            // behavior matched 'working-days' before this was set explicitly
            // (scenario 6 lag landed on Tuesday); set for reproducibility.
            lagCalendar                 : 'working-days',
            taskModeDefault             : 'auto',
            // 'warn' reports resource-overallocation conflicts per their docs;
            // scenario "auto-level" investigation switches this to 'auto'.
            ...(sc.flags?.warnMode ? { resourceLeveling : 'warn' } : {})
        },
        visuals : {
            showDependencies : true
        },
        // Config shape from pro.rv-grid.com/guides/gantt/resources/resource-planning-view/
        ...(resourcePlanning
            ? {
                resourcePlanning : {
                    enabled               : true,
                    loadGranularity       : 'day',
                    capacityDisplay       : 'line',
                    overAllocationDisplay : 'highlight'
                }
            }
            : {})
    };
}

function renderGrid(sc, adapted, { resourcePlanning = false } = {}) {
    grid?.remove();

    grid = document.createElement('revo-grid');
    grid.plugins = [GanttPlugin];
    grid.hideAttribution = true;
    grid.source = adapted.tasks;
    grid.columns = [
        { prop : 'name', name : 'Task', size : 160 },
        // Native engine-maintained assignees column: reflects live assignment
        // changes (editor saves) rather than a static snapshot string. Replaces
        // the old custom `assignedTo` column, which was computed once at load.
        { ...createDefaultTaskTableColumn('assignees'), size : 130 },
        { prop : 'startDate', name : 'Start', size : 110 },
        { prop : 'endDate', name : 'End', size : 110 }
    ];
    grid.gantt = ganttConfig(sc, { resourcePlanning });
    grid.ganttCalendars = adapted.calendars;
    grid.ganttDependencies = adapted.dependencies;
    grid.ganttResources = adapted.resources;
    grid.ganttAssignments = adapted.assignments;

    gridHost.appendChild(grid);
    bindToolbar();
}

function bindToolbar() {
    toolbarEl.innerHTML = '';
    defineGanttToolbar(toolbarEl, {
        grid,
        controls : {
            history      : true,
            undo         : true,
            redo         : true,
            zoom         : true,
            dependencies : true
        }
    });
}

function addViewToggle(sc) {
    // Task view / Resource load flip gantt.resourcePlanning.enabled in place.
    // The <revo-grid> `gantt` prop is reactive, so reassigning it switches the
    // view without recreating the element - this preserves in-session edits
    // (assignments, drags) and avoids the full reload. (Recreating via
    // renderGrid re-fed the original snapshot, wiping edits on every toggle.)
    const taskBtn = document.createElement('button');
    taskBtn.textContent = 'Task view';
    const resBtn = document.createElement('button');
    resBtn.textContent = 'Resource load';
    taskBtn.addEventListener('click', () => {
        resourceViewOn = false;
        grid.gantt = ganttConfig(sc, { resourcePlanning : false });
    });
    resBtn.addEventListener('click', () => {
        resourceViewOn = true;
        grid.gantt = ganttConfig(sc, { resourcePlanning : true });
    });
    controlsEl.append(taskBtn, resBtn);
}

// True once the timeline has actually painted: task bars in task view, or
// per-day load cells ("100%") in the resource planning view.
function ganttPainted() {
    // "toolbar" contains "bar", so exclude toolbar matches explicitly.
    const bars = [...document.querySelectorAll('[class*="gantt"] [class*="bar"]')]
        .filter(el => !el.closest('[class*="toolbar"]'));
    if (bars.length > 0) return true;
    return /\d+%/.test(document.querySelector('revo-grid')?.innerText ?? '');
}

// Safety net for silent blank renders (RevoGrid renders nothing, with no
// error, when it dislikes something about a load - see the missing-`tags`
// finding). If the timeline hasn't painted after 8s, reload the page (the
// same recovery scenario switching uses). NOTE: an occluded/background tab
// throttles timers ~16x and can starve the first paint past this timeout -
// keep the tab visible when judging render behavior (research
// benchmark-findings.md documents this trap).
const BLANK_RETRY_KEY = 'revogrid-blank-reloads';
function ensurePainted() {
    const t0 = performance.now();
    (function check() {
        if (ganttPainted()) {
            sessionStorage.removeItem(BLANK_RETRY_KEY);
            return;
        }
        if (performance.now() - t0 < 8000) {
            setTimeout(check, 250);
            return;
        }
        const retries = Number(sessionStorage.getItem(BLANK_RETRY_KEY) ?? 0);
        if (retries < 3) {
            sessionStorage.setItem(BLANK_RETRY_KEY, String(retries + 1));
            location.reload();
        }
        else {
            setStatus('Timeline did not paint after 4 loads. Is the tab visible? (Background tabs throttle timers.)');
        }
    })();
}

async function loadScenario(id) {
    const sc = scenarios.find(s => s.id === id);
    controlsEl.innerHTML = '';
    setStatus(sc.note);

    currentAdapted = adaptScenario(sc);
    resourceViewOn = Boolean(sc.flags?.utilization) || sc.id === 'drag-reassign';
    renderGrid(sc, currentAdapted, { resourcePlanning : resourceViewOn });
    addViewToggle(sc);
    ensurePainted();
}

// defineGanttToolbar silently renders nothing when invoked a second time for a
// fresh grid instance (no error thrown), so scenario switches do a full page
// reload with the scenario id in the hash to always get first-call behavior.
scenarioSelect.addEventListener('change', e => {
    location.hash = e.target.value;
    location.reload();
});

const initial = location.hash.slice(1);
const initialId = scenarios.some(s => s.id === initial) ? initial : scenarios[0].id;
scenarioSelect.value = initialId;
// defineCustomElements() registers <revo-grid> asynchronously. Creating the
// grid and assigning its properties before the definition lands makes the
// GanttPlugin silently render a blank grid (no error, no rows) on a random
// subset of page loads. Wait for the element definition before first render.
customElements.whenDefined('revo-grid').then(() => loadScenario(initialId));
