// Quick checks that nothing important broke: pages load (prerendered and hydrated without errors),
// languages work through their URLs, login and CV request are reachable, search finds things,
// nothing overflows on phones, and there are no serious accessibility problems.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = ['/', '/skills', '/knowhow', '/projects', '/blog', '/hobbies', '/about', '/contact', '/impressum', '/datenschutz', '/login'];
const DETAIL_PAGES = ['/knowhow/kubernetes/kubernetes-from-pod-to-nextcloud', '/projects/kanji-trainer', '/blog/articles/semester-start'];

/** Collects uncaught errors and console errors (e.g. React hydration mismatches). */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test.describe('pages', () => {
  for (const path of [...PAGES, ...DETAIL_PAGES, '/de', '/de/skills', '/ja/about']) {
    test(`${path} loads without errors`, async ({ page }) => {
      const errors = watchErrors(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle('Kaito Tech');
      await expect(page.locator('h1').first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('phones: no horizontal scrolling', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only');
    for (const path of [...PAGES, '/ja', '/de/about']) {
      await open(page, path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('languages', () => {
  test('German and Japanese pages are prerendered in their language', async ({ request }) => {
    const de = await (await request.get('/de/skills')).text();
    expect(de).toContain('<html lang="de"');
    expect(de).toContain('Womit ich arbeite');
    expect(de).toContain('hreflang="ja" href="https://www.kaito-tech.site/ja/skills"');
    const ja = await (await request.get('/ja/projects')).text();
    expect(ja).toContain('<html lang="ja"');
    expect(ja).toContain('href="/ja/skills"');
  });

  test('switching the language moves to its URL and back', async ({ page }) => {
    await open(page, '/skills');
    await page.getByRole('button', { name: /Change language/ }).click();
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await expect(page).toHaveURL(/\/de\/skills$/);
    await expect(page.locator('h1')).toHaveText('Womit ich arbeite');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await page.goBack();
    await expect(page).toHaveURL(/\/skills$/);
    await expect(page.locator('h1')).toHaveText('What I work with');
  });

  test('a saved language is applied on English URLs', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lang', 'ja'));
    await open(page, '/projects');
    await expect(page).toHaveURL(/\/ja\/projects$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  });
});

test.describe('features', () => {
  test('login page is reachable from the footer', async ({ page }) => {
    await open(page, '/');
    await page.locator('footer').getByRole('link', { name: /log ?in|sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('CV is offered on request, not as a public PDF', async ({ page }) => {
    await open(page, '/about');
    await expect(page.locator('#cv-request')).toBeVisible();
    await expect(page.locator('a[href$="cv.pdf"]')).toHaveCount(0);
  });

  test('home page shows the highlights', async ({ page }) => {
    await open(page, '/');
    await expect(page.getByRole('list', { name: 'highlights' })).toContainText('projects');
  });

  test('search (⌘K / Ctrl+K) finds and opens a project', async ({ page }) => {
    await open(page, '/');
    await page.keyboard.press('ControlOrMeta+k');
    const dialog = page.getByRole('dialog', { name: 'Search the site' });
    await expect(dialog).toBeVisible();
    await page.keyboard.type('kanji');
    await expect(dialog.getByRole('option').first()).toContainText('Kanji');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/kanji-trainer$/);
    await expect(dialog).toBeHidden();
  });
});

test.describe('accessibility', () => {
  for (const path of ['/', '/skills', '/knowhow', '/projects', '/blog', '/about', '/contact', '/login', '/de', DETAIL_PAGES[0]]) {
    test(`${path} has no serious accessibility issues`, async ({ page }) => {
      // No transitions, so colours are final right after switching the theme.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, path);
      for (const theme of ['dark', 'light']) {
        await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
        await page.waitForTimeout(50);
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(serious.map((v) => `${theme}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
      }
    });
  }
});
