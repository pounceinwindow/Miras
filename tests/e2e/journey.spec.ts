import { expect, test } from '@playwright/test'

test('encounter goes directly to the battle flow without a quiz', async ({
  page,
}) => {
  await page.goto('/encounter/forest-01')
  await expect(page.getByRole('heading', { name: 'Давай познакомимся.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Начать испытание/ })).toBeVisible()
  await expect(page.getByText(/викторины нет/i)).toBeVisible()
})

test('unknown encounter is handled', async ({ page }) => {
  await page.goto('/encounter/missing')
  await expect(page.getByRole('heading', { name: 'Метка не найдена' })).toBeVisible()
})

test('home exposes the camera scanner', async ({ page }) => {
  await page.goto('/home')
  await expect(page.getByRole('button', { name: /Начать сканировать/ })).toBeVisible()
})
