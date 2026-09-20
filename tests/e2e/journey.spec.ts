import { expect, test } from '@playwright/test'

test('encounter shows lore, a quiz, and a battle flow', async ({
  page,
}) => {
  await page.goto('/encounter/forest-01')
  await expect(page.getByRole('heading', { name: 'Сила хранителя' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Начать испытание/ })).toBeVisible()
  await expect(page.getByText(/ответь на вопрос/i)).toBeVisible()
})

test('unknown encounter is handled', async ({ page }) => {
  await page.goto('/encounter/missing')
  await expect(page.getByRole('heading', { name: 'Метка не найдена' })).toBeVisible()
})

test('home exposes the camera scanner', async ({ page }) => {
  await page.goto('/home')
  await expect(page.getByRole('button', { name: /Начать сканировать/ })).toBeVisible()
})

test('Su Anasy and Kremlin cards use the approved bilingual lines', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/entity/su-anasy')
  await expect(
    page.locator('.character-speech--paper').getByText('Су һәркемгә дә серен ачмый.'),
  ).toBeVisible()
  await expect(
    page.locator('.character-speech--paper').getByText('Вода не каждому открывает свои тайны.'),
  ).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 120))
  await expect(page.locator('.character-speech--hero')).toHaveAttribute(
    'aria-hidden',
    'false',
  )
  await page.getByRole('button', { name: 'Реплика: Су анасы' }).click()
  await expect(page.locator('.character-speech--hero')).toHaveAttribute(
    'aria-hidden',
    'true',
  )
  await expect(page.locator('.character-speech--hero')).toHaveCount(0, {
    timeout: 1500,
  })
  await page.getByRole('button', { name: 'Показать реплику' }).click()
  await expect(page.locator('.character-speech--hero')).toHaveAttribute(
    'aria-hidden',
    'false',
  )

  await page.goto('/encounter/stone-01')
  await expect(
    page.locator('.character-speech--paper').getByText('Мин бу шәһәрнең күп гасырлык хәтерен саклыйм.'),
  ).toHaveCount(0)
  await expect(
    page.locator('.character-speech--hero').getByText('Казан рухын йөрәгеңдә йөртә аласыңмы — күрсәтик.'),
  ).toBeVisible()
  await expect(page.getByText('Перед боем', { exact: true })).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('lore card uses supplied art and folds with its character still visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/entity/shurale')

  const card = page.locator('.entity-lore-card')
  const visual = page.locator('.entity-lore-visual')
  const officialArt = page.getByAltText('Изображение: Шурале')
  const sprite = page.locator('.entity-pixel-art')
  await expect(officialArt).toHaveAttribute('src', '/official/shurale.png')
  await expect(page.getByRole('link', { name: 'К коллекции' })).toHaveCount(0)
  await expect(sprite).toHaveAttribute('src', '/pixel/shurale.png')
  await expect(officialArt).toBeVisible()
  await expect(sprite).toBeVisible()
  expect((await visual.boundingBox())!.height).toBeLessThanOrEqual(282)
  await expect(page.getByText('Шурале (ориг. Шүрәле)', { exact: false })).toBeVisible()

  const handle = page.getByRole('button', { name: 'Скрыть изображение' })
  const handleBox = (await handle.boundingBox())!
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y - 60,
    { steps: 4 },
  )
  await page.mouse.up()
  await expect(card).toHaveClass(/is-collapsed/)
  await expect(officialArt).toHaveCSS('opacity', '0')
  await expect(visual).toHaveCSS('height', '0px')
  await expect(sprite).toBeVisible()
  const showImage = page.getByRole('button', { name: 'Показать изображение' })
  await expect(showImage).toBeVisible()

  const spriteBox = (await sprite.boundingBox())!
  const contentBox = (await page.locator('.entity-lore-content').boundingBox())!
  const handleBoxAfterCollapse = (await showImage.boundingBox())!
  const cardBox = (await card.boundingBox())!
  expect(spriteBox.x).toBeGreaterThan(contentBox.x + contentBox.width * 0.6)
  expect(spriteBox.y + spriteBox.height).toBeGreaterThan(contentBox.y + 50)
  expect(
    Math.abs(
      handleBoxAfterCollapse.x +
        handleBoxAfterCollapse.width / 2 -
        (cardBox.x + cardBox.width / 2),
    ),
  ).toBeLessThan(2)

  await page.screenshot({ path: 'test-results/entity-lore-collapsed.png', fullPage: true })
})
