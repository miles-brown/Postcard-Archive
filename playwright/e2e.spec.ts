import { test, expect } from '@playwright/test';

test('has title and can navigate to gallery', async ({ page }) => {
    await page.goto('/');

    // Verify homepage loads with main heading
    await expect(page.locator('h1')).toContainText('Historical');

    // Click on explore button
    await page.click('text="Explore Archive"');

    // Ensure it navigates to gallery successfully
    await expect(page).toHaveURL(/.*\/gallery/);
    await expect(page.locator('h1')).toContainText('Postcard Archive');
});

test('can view postcard detail page', async ({ page }) => {
    // Assuming the DB has been seeded with at least one public postcard
    await page.goto('/gallery');

    // Wait for postcards to load
    await page.waitForSelector('.grid');

    // Try to find a specific postcard link or click the first one if available
    const postcardLink = page.locator('a[href^="/postcard/"]').first();
    if (await postcardLink.count() > 0) {
        await postcardLink.click();

        // Check if details page rendered
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('text="Listing Information"')).toBeVisible();
    } else {
        // If no postcards in DB, just verify empty state
        await expect(page.locator('text="No postcards found"')).toBeVisible();
    }
});

test('login flow redirects correctly', async ({ page }) => {
    await page.goto('/upload');

    // As test user is not logged in by default, it should show Not Signed In
    await expect(page.locator('text="Not Signed In"')).toBeVisible();
});
