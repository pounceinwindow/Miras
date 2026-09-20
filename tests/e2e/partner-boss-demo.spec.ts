import { expect, test } from '@playwright/test'

test('partner boss demo is complete and mobile-safe', async ({ page }) => {
  await page.goto('/partner-boss-demo.html')

  await expect(page.getByRole('heading', { name: 'Чак-чакич' })).toBeVisible()
  await expect(page.getByText('−20% на весь заказ')).toBeVisible()
  await expect(page.getByRole('button', { name: /Бросить вызов/ })).toBeVisible()
  await expect(page.getByText('Партнёр Miras', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Особая встреча', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Уровень', { exact: true })).toHaveCount(0)
  await expect(page.locator('.boss-ability > span')).toHaveCount(0)
  await expect(page.locator('.boss-sprite')).toHaveAttribute(
    'src',
    '/partner/chak-chakich.png',
  )

  for (const width of [320, 390, 480]) {
    await page.setViewportSize({ width, height: 844 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'test-results/partner-boss-demo.png',
    fullPage: true,
  })
})
