// Scenario 5 verification with Scheduler Pro's documented effort model:
// FixedDuration + effortDriven. Expected on adding a second 100% resource:
// effort stays 32h and assignment units rebalance (SP docs: "effort is kept
// intact ... and assignment units is updated").
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
    executablePath : CHROME,
    headless       : false,
    userDataDir    : '/tmp/scheduler-benchmark-profile-2',
    args           : [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1200,800',
        '--no-first-run'
    ]
});
const page = await browser.newPage();

await page.goto('http://localhost:4180/', { waitUntil : 'domcontentloaded' });
await page.waitForFunction(() => window.project?.eventStore?.count > 0, { timeout : 30000 });
await page.evaluate(() => {
    const sel = document.getElementById('scenario');
    sel.value = 'effort-driven';
    sel.dispatchEvent(new Event('change'));
});
await page.waitForFunction(
    () => window.project?.eventStore?.getById('f1')?.schedulingMode === 'FixedDuration',
    { timeout : 30000 }
);

const result = await page.evaluate(async() => {
    const p = window.project;
    const e = p.eventStore.getById('f1');
    const read = () => ({
        dur    : e.duration,
        effort : e.effort,
        s      : e.startDate?.toDateString(),
        end    : e.endDate?.toDateString(),
        units  : p.assignmentStore.records
            .filter(a => String(a.eventId) === 'f1')
            .map(a => ({ res : String(a.resourceId), units : a.units }))
    });
    const before = read();
    p.assignmentStore.add({ id : 'fa-extra', event : 'f1', resource : 'r2' });
    await p.commitAsync();
    return { before, after : read() };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
