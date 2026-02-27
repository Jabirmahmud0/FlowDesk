import { test, expect } from '@playwright/test';

/**
 * Landing Page & Marketing E2E Tests
 */

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('has correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/FlowDesk/i);
    });

    test('hero section is visible', async ({ page }) => {
        // Hero heading should be visible above the fold
        const hero = page.locator('h1').first();
        await expect(hero).toBeVisible();
    });

    test('has call-to-action button', async ({ page }) => {
        // At least one prominent CTA exists
        const cta = page.getByRole('link', { name: /get started|sign up|try free/i }).first();
        await expect(cta).toBeVisible();
    });

    test('pricing page is accessible', async ({ page }) => {
        await page.goto('/pricing');
        await expect(page.getByRole('heading', { name: /pricing|plans/i })).toBeVisible();
    });

    test('pricing page shows multiple plans', async ({ page }) => {
        await page.goto('/pricing');
        // Should show at least 2 plan cards
        const cards = page.locator('[class*="card"], [class*="plan"], article');
        await expect(cards).toHaveCount({ min: 2 });
    });

    test('navigation links work', async ({ page }) => {
        // Login link goes to login page
        const authLinks = page.getByRole('link', { name: /sign in|log in/i });
        if (await authLinks.count() > 0) {
            await authLinks.first().click();
            await expect(page).toHaveURL(/\/auth\/login/);
        }
    });

    test('page is responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.locator('h1').first()).toBeVisible();
    });
});
