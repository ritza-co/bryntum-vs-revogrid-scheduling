import { Scheduler, ProjectModel, ResourceHistogram } from '@bryntum/scheduler-enterprise';
import { Splitter } from '@bryntum/core-enterprise';
import { scenarios, calendars as sharedCalendars } from '../shared/scenarios.js';
import './style.css';

const DEP_TYPE = { SS : 0, SF : 1, FS : 2, FF : 3 };

// Shared calendar ids -> Bryntum calendar definitions.
// "business" = weekends off; "tue-thu" = only Tue/Wed/Thu working.
function adaptCalendars(list) {
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return list.map(cal => ({
        id                       : cal.id,
        name                     : cal.name,
        unspecifiedTimeIsWorking : false,
        // 8h working day (09:00-17:00) on each shared workingDays entry
        intervals                : cal.workingDays.map(d => ({
            recurrentStartDate : `on ${DAY_NAMES[d]} at 09:00`,
            recurrentEndDate   : `on ${DAY_NAMES[d]} at 17:00`,
            isWorking          : true
        }))
    }));
}

function adaptProject(data) {
    return {
        calendar    : 'business',
        hoursPerDay : 8,
        daysPerWeek : 5,
        calendars   : adaptCalendars(data.calendars ?? [sharedCalendars.business]),
        resources   : data.resources.map(r => ({
            id       : r.id,
            name     : r.name,
            role     : r.role,
            calendar : r.calendar,
            maxUnits : r.capacity
        })),
        events : data.events.map(e => ({
            id                : e.id,
            name              : e.name,
            startDate         : e.start,
            duration          : e.durationDays,
            durationUnit      : 'day',
            manuallyScheduled : e.manuallyScheduled ?? false,
            // Effort events: the Enterprise tier EventModel supports 'Normal' and
            // 'FixedDuration' scheduling modes (FixedEffort/FixedUnits are
            // Bryntum GANTT task modes). FixedDuration + effortDriven keeps
            // effort intact and rebalances assignment units - Scheduler's
            // documented effort model.
            ...(e.schedulingMode === 'fixed-work'
                ? { schedulingMode : 'FixedDuration', effortDriven : true, effort : e.effortHours, effortUnit : 'hour' }
                : {}),
            ...(e.constraintType === 'must-start-on'
                ? { constraintType : 'muststarton', constraintDate : e.constraintDate }
                : {})
        })),
        assignments : data.assignments.map(a => {
            const event = data.events.find(e => e.id === a.event);
            // Fixed-effort events: let the engine calculate units
            return event?.schedulingMode === 'fixed-work'
                ? { id : a.id, event : a.event, resource : a.resource }
                : { id : a.id, event : a.event, resource : a.resource, units : a.units };
        }),
        dependencies : data.dependencies.map(d => ({
            id        : d.id,
            fromEvent : d.from,
            toEvent   : d.to,
            type      : DEP_TYPE[d.type],
            lag       : d.lagDays,
            lagUnit   : 'day'
        }))
    };
}

const scenarioSelect = document.getElementById('scenario');
const statusEl = document.getElementById('status');
const controlsEl = document.getElementById('controls');
const appEl = document.getElementById('app');

let scheduler = null;
let histogram = null;
let splitter = null;
let project = null;

for (const sc of scenarios) {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.name;
    scenarioSelect.appendChild(opt);
}

function destroyCurrent() {
    histogram?.destroy();
    splitter?.destroy();
    scheduler?.destroy();
    histogram = splitter = scheduler = null;
    controlsEl.innerHTML = '';
    appEl.innerHTML = '';
}

function setStatus(text) {
    statusEl.textContent = text;
}

async function loadScenario(id) {
    const sc = scenarios.find(s => s.id === id);
    destroyCurrent();
    setStatus(sc.note);

    project = new ProjectModel(adaptProject(sc));

    scheduler = new Scheduler({
        appendTo   : appEl,
        project,
        startDate  : '2026-08-02',
        endDate    : '2026-08-10',
        viewPreset : 'weekAndDayLetter',
        rowHeight  : 62,
        barMargin  : 10,
        eventStyle : 'filled',
        eventColor : 'indigo',
        columns    : [
            { text : 'Name', field : 'name', width : 150 },
            { text : 'Role', field : 'role', width : 120 }
        ],
        features : {
            dependencies   : true,
            dependencyEdit : { showLagField : true },
            nonWorkingTime : true,
            percentBar     : false
        },
        snap : sc.id === 'drag-snapping'
    });

    if (sc.flags?.undo) {
        // Show the toolbar now, but defer enabling the STM until after the
        // initial schedule calculation (see commitAsync below). Enabling it
        // here would record that first propagation as undo transaction #1,
        // leaving the stack dirty ("1 undo / 0 redo") before the user acts.
        scheduler.tbar = [{ type : 'undoredo', text : true }];
    }

    // Instrumentation for benchmark verification (not part of the comparison)
    window.project = project;
    window.scheduler = scheduler;

    if (sc.flags?.utilization || sc.flags?.warnMode) {
        scheduler.flex = '1 1 60%';
        splitter = new Splitter({ appendTo : appEl });
        histogram = new ResourceHistogram({
            appendTo      : appEl,
            project,
            partner       : scheduler,
            flex          : '1 1 50%',
            hideHeaders   : true,
            showMaxEffort : true,
            showBarText   : true,
            rowHeight     : 40,
            showBarTip     : true,
            columns       : [{ text : 'Name', field : 'name', width : 150 }]
        });
    }

    await project.commitAsync();

    // Enable undo tracking only after the initial schedule has settled, so the
    // engine's first propagation isn't captured as an undoable action.
    if (sc.flags?.undo) {
        project.stm.enable();
        project.stm.autoRecord = true;
    }
}

scenarioSelect.addEventListener('change', e => loadScenario(e.target.value));

loadScenario(scenarios[0].id);
