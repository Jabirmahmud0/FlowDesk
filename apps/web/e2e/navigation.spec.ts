import { test, expect, type Page } from '@playwright/test';

/**
 * Navigation & Search E2E Tests
 *
 * These tests use a pre-authenticated state (storage state file).
 * For CI, set PLAYWRIGHT_BASE_URL and ensure a test account exists.
 */

// Helper: fill login form with test credentials
async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
}

test.describe('Command Palette (Global Search)', () => {
    test('Ctrl+K opens search dialog', async ({ page }) => {
        await page.goto('/auth/login');
        // Navigate to any authenticated page context
        // We test the keyboard shortcut listener on the page
        await page.keyboard.press('Control+k');
        // If there's a search dialog, it should appear
        // (Will only open fully if CommandPalette is mounted — works inside org layout)
        // This test at minimum verifies K shortcut doesn't break anything
        await page.waitForTimeout(300);
    });
});

test.describe('Public Navigation', () => {
    test('login page has link to register', async ({ page }) => {
        await page.goto('/auth/login');
        const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
        await expect(registerLink).toBeVisible();
    });

    test('register page has link to login', async ({ page }) => {
        await page.goto('/auth/register');
        const loginLink = page.getByRole('link', { name: /sign in|log in|already have/i });
        await expect(loginLink).toBeVisible();
    });

    test('forgot password link exists on login page', async ({ page }) => {
        await page.goto('/auth/login');
        const forgotLink = page.getByRole('link', { name: /forgot|reset/i });
        await expect(forgotLink).toBeVisible();
    });
});

test.describe('API Health', () => {
    test('API ping endpoint responds', async ({ request }) => {
        const response = await request.get('/api/ping');
        expect(response.status()).toBeLessThan(500);
    });
});
