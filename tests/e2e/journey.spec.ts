import { expect, test } from '@playwright/test'

async function openShuraleChallenge(page: import('@playwright/test').Page) {
  await page.goto('/encounter/forest-01')
  await page.getByRole('button', { name: 'Я готов к знакомству' }).click()
  for (const [index, answer] of [
    'В лесу',
    'Габдулла Тукай',
    'Бревно с расщелиной',
  ].entries()) {
    await page.getByRole('radio', { name: answer, exact: true }).check()
    await page
      .getByRole('button', {
        name: index === 2 ? 'Завершить знакомство' : 'Следующий вопрос',
      })
      .click()
  }
  await expect(
    page.getByRole('heading', { name: 'Шурале принимает вызов' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Начать испытание' }).click()
}

test('starts with Su anasy and captures Shurale only after a real-time battle', async ({
  page,
}) => {
  test.setTimeout(75_000)
  await page.goto('/collection')
  await expect(page.getByText('Найдено 1 из 4.')).toBeVisible()
  await expect(
    page.getByText('Су анасы', { exact: true }).first(),
  ).toBeVisible()

  await openShuraleChallenge(page)
  await page.getByRole('button', { name: 'Принять испытание' }).click()
  await expect(page.locator('.lane-arena')).toBeVisible()

  for (let attempt = 0; attempt < 180; attempt++) {
    if (await page.getByText('ПОБЕДА', { exact: true }).isVisible()) break
    const enabled = page.locator('.combat-lane:not(:disabled)')
    if ((await enabled.count()) === 0) break
    const threatened = page.locator('.combat-lane.threatened')
    const destination =
      (await threatened.count()) > 0
        ? page.locator('.combat-lane:not(.threatened):not(:disabled)').first()
        : page.locator('.combat-lane:not(:disabled)').filter({
            has: page.locator('.lane-fighter.enemy'),
          })
    if (
      !(await destination.evaluate((element) =>
        element.classList.contains('current'),
      ))
    )
      await destination.click()
    for (const skill of await page.locator('.pve-controls button').all())
      if (await skill.isEnabled()) await skill.click()
    await page.waitForTimeout(250)
  }

  await expect(page.getByText('ПОБЕДА', { exact: true })).toBeVisible()
  await expect(page.getByText('Шурале теперь в коллекции.')).toBeVisible()
  await page.getByRole('link', { name: 'К коллекции' }).click()
  await expect(page.getByText('Найдено 2 из 4.')).toBeVisible()
  await expect(page.locator('.balance b')).toHaveText('25')
})

test('failed quiz survives reload and unknown NFC is handled on mobile', async ({
  page,
}) => {
  await page.goto('/encounter/forest-01')
  await page.getByRole('button', { name: 'Я готов к знакомству' }).click()
  for (let index = 0; index < 3; index++) {
    await page.getByRole('radio').last().check()
    await page
      .getByRole('button', {
        name: index === 2 ? 'Завершить знакомство' : 'Следующий вопрос',
      })
      .click()
  }
  await expect(
    page.getByRole('heading', { name: 'У каждой истории своё время' }),
  ).toBeVisible()
  await page.reload()
  await expect(page.locator('.countdown')).toBeVisible()
  await page.goto('/encounter/missing')
  await expect(
    page.getByRole('heading', { name: 'Метка не найдена' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
