import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const views = [['Dashboard', 'Dashboard'], ['Farmer Portal', 'Farmer Portal'], ['Marketplace', 'Buyer Marketplace'], ['Demand Forecast', 'Demand Forecast'], ['Delivery Planner', 'Logistics Planner'], ['AI Assistant', 'FreshRoute Assistant']]

async function expectNoSeriousAxeViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))
  expect(serious, serious.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
}

async function navigateTo(page, label) {
  if ((page.viewportSize()?.width || 1000) < 700) await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

for (const [label, heading] of views) {
  test(`${label} exposes landmarks and no serious automated WCAG 2 A/AA violations`, async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('main')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
    await navigateTo(page, label)
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    await expectNoSeriousAxeViolations(page)
  })
}

test('matching is discoverable and modal focus is trapped then returned', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Find Best Matches' }).first().click()
  await expect(page.getByRole('heading', { name: 'Smart Matching', level: 1 })).toBeVisible()
  await navigateTo(page, 'Marketplace')
  const trigger = page.getByRole('button', { name: 'Post Requirement' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Post buying requirement' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close Post buying requirement' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Post requirement' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
