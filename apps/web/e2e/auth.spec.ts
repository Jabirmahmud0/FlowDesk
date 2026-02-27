import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests the login, registration, and auth redirect flows.
 */

test.describe('Authentication', () => {
    test('landing page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/FlowDesk/i);
        await expect(page.getByRole('heading', { name: /FlowDesk/i })).toBeVisible();
    });

    test('login page is accessible from landing', async ({ page }) => {
        await page.goto('/');
        const signInLink = page.getByRole('link', { name: /sign in|log in/i }).first();
        if (await signInLink.isVisible()) {
            await signInLink.click();
        } else {
            await page.goto('/auth/login');
        }
        await expect(page).toHaveURL(/\/auth\/login/);
        await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
    });

    test('login page has email and password fields', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('login shows error on invalid credentials', async ({ page }) => {
        await page.goto('/auth/login');
        await page.getByLabel(/email/i).fill('invalid@test.com');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|log in/i }).click();
        // Wait for error message
        await expect(
            page.getByText(/invalid|incorrect|error|wrong/i).first()
        ).toBeVisible({ timeout: 8000 });
    });

    test('register page is accessible', async ({ page }) => {
        await page.goto('/auth/register');
        await expect(page.getByRole('heading', { name: /create|register|sign up/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('forgot password page is accessible', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
        await page.goto('/some-org/dashboard');
        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('register links to login page', async ({ page }) => {
        await page.goto('/auth/register');
        const loginLink = page.getByRole('link', { name: /sign in|log in/i });
        await expect(loginLink).toBeVisible();
        await loginLink.click();
        await expect(page).toHaveURL(/\/auth\/login/);
    });
});
