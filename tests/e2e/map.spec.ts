import { test, expect } from '@playwright/test'

test('Map page renders points, allows zooming and simulates GPS interaction', async ({
  page,
}) => {
  // 1. Открытие страницы с главной
  await page.goto('/')
  await page.getByRole('link', { name: 'Карта' }).first().click()
  await expect(page).toHaveURL('/map')

  // 2. Отображение контейнера карты Leaflet
  await expect(page.locator('.map-canvas-container')).toBeVisible()
  await expect(page.locator('.leaflet-container')).toBeVisible()

  // 3. Отображение игровых точек
  await expect(page.locator('.custom-game-marker').first()).toBeVisible()
  const pointCount = await page.locator('.custom-game-marker').count()
  expect(pointCount).toBeGreaterThanOrEqual(4)

  // 4. Переключение масштабов (Казань / Татарстан)
  await page.getByRole('button', { name: 'Татарстан' }).click()
  await page.getByRole('button', { name: 'Казань' }).click()

  // 5. Открытие карточки точки по клику на маркер
  await page.locator('.custom-game-marker').first().click()
  await expect(page.locator('.location-bottom-card')).toBeVisible()
  await expect(page.locator('.location-name')).toBeVisible()
  await expect(page.locator('.entity-sub')).toContainText('Хранитель:')

  // 6. Проверка симуляции GPS для приближения к точке
  const simButton = page.locator(
    'button:has-text("Я на месте (симулировать GPS)")',
  )
  if (await simButton.isVisible()) {
    await simButton.click()
    // После симуляции дистанция становится в пределах радиуса
    await expect(page.locator('.map-sim-notice')).toBeVisible()
  }

  // 7. Переход к встрече с хранителем
  const encounterBtn = page
    .getByRole('link', { name: /Встретить хранителя/i })
    .first()
  await expect(encounterBtn).toBeVisible()
  await encounterBtn.click()

  // 8. Проверка, что открылся экран встречи и метка валидна
  await expect(page).toHaveURL(/\/encounter\//)
  await expect(
    page.getByRole('heading', { name: 'Метка не найдена' }),
  ).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Я готов к знакомству' }),
  ).toBeVisible()
})
