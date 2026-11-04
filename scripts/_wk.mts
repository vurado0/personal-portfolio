import { webkit } from '@playwright/test';
const S = '/private/tmp/claude-501/-Users-kaito-FHJ-personal-portfolio/44942cba-345b-41ac-8e8f-97ff71a1cf4c/scratchpad/wk', tag = process.argv[2] ?? 'before';
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:5173/projects');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/${tag}-0.png` });
await page.getByRole('navigation', { name: 'Main' }).last().getByRole('link', { name: 'Home' }).click();
for (const ms of [60, 200, 600, 1500]) { await page.waitForTimeout(ms); await page.screenshot({ path: `${S}/${tag}-${ms}.png` }); }
// how much of the viewport shows the wallpaper: sample pixels
await browser.close();
