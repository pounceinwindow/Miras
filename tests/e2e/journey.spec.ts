import { test, expect } from '@playwright/test'
async function captureShurale(page: import('@playwright/test').Page) {
  await page.goto('/encounter/forest-01')
  await page.getByRole('link', { name: 'Я готов к знакомству' }).click()
  await expect(page).toHaveURL(/\/quiz\/shurale$/)
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
async function startScannedBattle(page: import('@playwright/test').Page) {
  await page.goto('/home')
  await page.getByRole('button', { name: /Начать сканировать/ }).click()
  const scanner = page.frameLocator('iframe')
  await expect(scanner.locator('a-entity[mindar-image-target]')).toHaveCount(1)
  await scanner.locator('a-entity[mindar-image-target]').evaluate((anchor) => {
    anchor.dispatchEvent(new Event('targetFound'))
  })
  await expect(page).toHaveURL(/\/fight\/shurale$/)
  await expect(
    page.getByRole('button', { name: 'Атака +1 энергия', exact: true }),
  ).toBeVisible()
}
test('capture persists, scanning starts battle, result opens hero', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {})
  })
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => route.abort(),
  )
  await captureShurale(page)
  await page.getByRole('link', { name: 'Открыть коллекцию' }).click()
  await page.reload()
  await expect(page.getByText('Уровень 1', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Шурале', exact: true }).click()
  await expect(page).toHaveURL(/\/entity\/shurale$/)
  await expect(page.getByRole('button', { name: 'Улучшить' })).toBeVisible()
  await expect(page.locator('.entity-stats')).toContainText('70%')
  await expect(page.getByRole('link', { name: 'Перейти в бой' })).toHaveCount(0)
  await startScannedBattle(page)
  await expect(page.locator('.battle-canvas')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  while (
    await page
      .getByRole('button', { name: 'Атака +1 энергия', exact: true })
      .isVisible()
  ) {
    await expect(
      page.getByRole('button', { name: 'Атака +1 энергия', exact: true }),
    ).toBeEnabled()
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
    else if (await skill.isEnabled()) await skill.click()
    else
      await page
        .getByRole('button', { name: 'Атака +1 энергия', exact: true })
        .click()
    await expect(page.getByTestId('battle-feedback')).toBeVisible()
  }
  await expect(
    page.getByRole('heading', { name: 'Победа!' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'О герое' }).click()
  await expect(page).toHaveURL(/\/entity\/shurale$/)
})
test('failed quiz stays locked after reload, unknown NFC is handled, mobile fits', async ({
  page,
}) => {
  await page.goto('/encounter/forest-01')
  await page.getByRole('link', { name: 'Я готов к знакомству' }).click()
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

test('entity and quiz deep links, unknown IDs, locked collection and removed arena', async ({
  page,
}) => {
  await page.goto('/battle')
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByText('Арена', { exact: true })).toHaveCount(0)
  await page.goto('/collection')
  await expect(page.getByText('Ещё не знакомы', { exact: true })).toHaveCount(4)
  await page
    .getByRole('link', { name: 'Казанский Кремль', exact: true })
    .click()
  await expect(page.getByText('Ещё не найден', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Встретить хранителя' }),
  ).toBeVisible()
  await page.goto('/quiz/su-anasy')
  await expect(
    page.getByRole('heading', { name: 'С какой стихией связана Су анасы?' }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByText('Вопрос 1 из 3')).toBeVisible()
  await page.goto('/quiz/missing')
  await expect(
    page.getByRole('heading', { name: 'Хранитель не найден' }),
  ).toBeVisible()
  await page.goto('/entity/missing')
  await expect(
    page.getByRole('heading', { name: 'Хранитель не найден' }),
  ).toBeVisible()
})

test('an attack updates HP, blocks extra input during animation and persists the battle', async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {})
  })
  await captureShurale(page)
  await startScannedBattle(page)
  await expect(page.locator('.battle-canvas')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  const enemyHp = page.getByRole('progressbar', {
    name: 'Здоровье Казанский Кремль',
  })
  const before = Number(await enemyHp.getAttribute('value'))
  const attack = page.getByRole('button', {
    name: 'Атака +1 энергия',
    exact: true,
  })
  await attack.click()
  await expect(attack).toBeDisabled()
  await expect(page.getByTestId('battle-feedback')).toContainText(
    '−16 HP соперника',
  )
  await expect(enemyHp).toHaveAttribute('value', String(before - 16))
  await expect(attack).toBeEnabled()
  await page.reload()
  await expect(enemyHp).toHaveAttribute('value', String(before - 16))
  await expect(page.locator('.arena-top')).toContainText('Раунд 2')
})

test('failed quiz can be retried on the same route when cooldown expires', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/quiz/shurale')
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
  await page.clock.fastForward(24 * 60 * 60 * 1000 + 1000)
  await page.getByRole('button', { name: 'Попробовать снова' }).click()
  await expect(
    page.getByRole('heading', { name: 'Где обитает Шурале?' }),
  ).toBeVisible()
  await expect(page.getByText('Вопрос 1 из 3')).toBeVisible()
})
