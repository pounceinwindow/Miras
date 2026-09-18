import { test, expect } from '@playwright/test'
async function captureShurale(page: import('@playwright/test').Page) {
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
    page.getByRole('heading', { name: 'Шурале теперь с тобой!' }),
  ).toBeVisible()
}
test('NFC to collection, persistence, battle reward and upgrade', async ({
  page,
}) => {
  await captureShurale(page)
  await page.getByRole('link', { name: 'Открыть коллекцию' }).click()
  await page.reload()
  await expect(page.getByText('Уровень 1', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Выбрать для поединка' }).click()
  for (let match = 0; match < 2; match++) {
    await page.getByRole('button', { name: 'Начать поединок' }).click()
    await expect(
      page.getByRole('button', { name: 'Атака +1 энергия', exact: true }),
    ).toBeVisible()
    while (
      await page
        .getByRole('button', { name: 'Атака +1 энергия', exact: true })
        .isVisible()
    ) {
      const round = await page.locator('.arena-top').innerText()
      const skill = page.getByRole('button', {
        name: 'Особый приём Двойной урон · 3 энергии',
        exact: true,
      })
      if (
        await page
          .getByText('Соперник готовит: Особый приём', { exact: true })
          .isVisible()
      )
        await page
          .getByRole('button', {
            name: 'Защита −70% входящего урона · +1 энергия',
            exact: true,
          })
          .click()
      else if (
        (await page
          .getByText('Соперник готовит: Атака', { exact: true })
          .isVisible()) &&
        (await skill.isEnabled())
      )
        await skill.click()
      else
        await page
          .getByRole('button', { name: 'Атака +1 энергия', exact: true })
          .click()
      await expect(page.locator('.arena-top')).not.toHaveText(round)
    }
    await expect(
      page.getByRole('heading', { name: 'Победа! +25 чак-чака' }),
    ).toBeVisible()
    if (match === 0)
      await page.getByRole('button', { name: 'Ещё поединок' }).click()
  }
  await page.getByRole('link', { name: 'К коллекции', exact: true }).click()
  await page.getByRole('button', { name: 'Улучшить · 30', exact: true }).click()
  await expect(page.getByText('Уровень 2', { exact: true })).toBeVisible()
  await expect(page.locator('.balance b')).toHaveText('20')
})
test('failed quiz stays locked after reload, unknown NFC is handled, mobile fits', async ({
  page,
}) => {
  await page.goto('/encounter/forest-01')
  await page.getByRole('button', { name: 'Я готов к знакомству' }).click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio').first().check()
    await page
      .getByRole('button', {
        name: i === 2 ? 'Завершить знакомство' : 'Следующий вопрос',
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
  await page.goto('/')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
