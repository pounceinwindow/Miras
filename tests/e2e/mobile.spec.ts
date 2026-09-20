import { test, expect, type Page } from '@playwright/test'

async function setScannerLocation(
  page: Page,
  latitude = 55.79194444444444,
  longitude = 49.102222222222224,
) {
  await page.context().grantPermissions(['geolocation'])
  await page.context().setGeolocation({ latitude, longitude })
}

test('home has a mobile layout, captive arena and working entry points', async ({
  page,
}) => {
  await page.goto('/home')
  await expect(
    page.getByRole('heading', { name: 'Мои хранители' }),
  ).toBeVisible()
  await expect(page.locator('.captive-arena')).toBeVisible()
  await expect(page.locator('.hero-compact-pixel')).toHaveCount(4)
  await expect(page.locator('.hero-compact-pixel').first()).toHaveAttribute(
    'src',
    '/pixel/shurale.png',
  )
  for (const width of [320, 390, 480, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect(
      await page
        .locator('.app-shell')
        .evaluate((el) => el.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(480)
    const scan = await page.locator('.scan-tile').boundingBox()
    const map = await page.locator('.map-tile').boundingBox()
    expect(scan!.y).toBe(map!.y)
    expect(Math.abs(scan!.width - scan!.height)).toBeLessThan(15)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight >= innerHeight,
    ),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/mobile-home.png',
    fullPage: true,
  })
  await expect(page.locator('.topbar .avatar')).toBeVisible()
})

test('pages keep their content size and scroll on short screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 480 })
  await page.route('**.basemaps.cartocdn.com/**', (route) => route.abort())

  const pages = [
    ['/home', '.heroes-preview-section'],
    ['/map', '.live-map-shell'],
    ['/entity/shurale', '.entity-lore-card'],
    ['/encounter/forest-01', '.entity-lore-card'],
    ['/fight/shurale', '.fighting-embed'],
  ] as const

  for (const [route, selector] of pages) {
    await page.goto(route)
    const content = page.locator(selector)
    await expect(content).toBeVisible()
    expect((await content.boundingBox())!.height).toBeGreaterThan(40)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight,
      ),
    ).toBe(true)
  }

  await page.goto('/home')
  const actionHeight = await page
    .locator('.action-tile')
    .first()
    .evaluate((element) => element.getBoundingClientRect().height)
  expect(actionHeight).toBeGreaterThan(140)
  await page.screenshot({
    path: 'test-results/mobile-home-short.png',
    fullPage: true,
  })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(page.locator('.captive-arena')).toBeInViewport()
})

test('map keeps locations available without tiles or geolocation', async ({
  page,
}) => {
  await page.route('**.basemaps.cartocdn.com/**', (route) => route.abort())
  await page.goto('/home')
  await page.getByRole('link', { name: /Открыть карту/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Куда отправимся?' }),
  ).toBeVisible()
  await expect(page.locator('.places-list > button')).toHaveCount(4)
  await expect(
    page.getByText('Подложка карты недоступна.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Башня Сююмбике/ }).click()
  await expect(
    page.getByRole('region', { name: 'Выбранное место' }),
  ).toContainText('Башня Сююмбике')
  await page.getByRole('link', { name: 'Встретить хранителя' }).click()
  await expect(page).toHaveURL(/\/encounter\/tower-01$/)
})

test('scanner opens on home with one tap, handles denial and retries', async ({
  page,
}) => {
  await setScannerLocation(page)
  await page.addInitScript(() => {
    if (navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError')
      }
  })

  await page.goto('/home')
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByRole('button', { name: /Начать сканировать/ }).click()
  await expect(page).toHaveURL(/\/home$/)
  await expect(
    page.getByRole('dialog', { name: 'Сканировать место' }),
  ).toBeVisible()
  const scanner = page.frameLocator('iframe')
  await expect(scanner.getByRole('status')).toHaveText(
    'Не удалось включить камеру',
  )
  await expect(
    scanner.getByRole('button', { name: /Включить камеру/ }),
  ).toBeEnabled()
  await scanner.getByRole('button', { name: /Включить камеру/ }).click()
  await expect(scanner.getByRole('status')).toHaveText(
    'Не удалось включить камеру',
  )
  await expect(scanner.locator('a-scene')).toHaveCount(0)
  await page.getByRole('button', { name: 'Закрыть камеру' }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('scanner loads all AR targets without requesting GPS', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: () => {
          throw new Error('Scanner must not request GPS')
        },
      },
    })
    if (navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError')
      }
  })

  await page.goto('/home')
  await page.getByRole('button', { name: /Начать сканировать/ }).click()

  const scanner = page.frameLocator('iframe')
  await expect(scanner.getByRole('status')).toHaveText(
    'Не удалось включить камеру',
  )
})

test('battle opens as an immersive page with compact header controls', async ({
  page,
}) => {
  await page.goto('/fight/su-anasy?enemy=kereml')
  await expect(page.locator('.battle-page')).toHaveCSS('position', 'fixed')
  await expect(page.locator('.topbar')).toBeHidden()
  await expect(page.getByRole('link', { name: 'Назад' })).toHaveCount(0)
  const fight = page.frameLocator('iframe')
  await expect(fight.locator('.masthead h1')).toHaveCount(0)
  await expect(
    fight.getByRole('button', { name: 'Включить звук' }),
  ).toBeVisible()
  await expect(
    fight.getByRole('button', { name: 'Пауза и меню' }),
  ).toBeVisible()
  await expect(
    fight.getByRole('button', { name: 'На весь экран' }),
  ).toBeVisible()
})

test('outside tap closes the sheet, inside tap keeps it open, Escape works and focus returns', async ({
  page,
}) => {
  await setScannerLocation(page)
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {})
  })
  await page.goto('/home')
  const trigger = page.getByRole('button', { name: /Начать сканировать/ })
  await trigger.click()
  const sheet = page.getByRole('dialog')
  const scanner = page.frameLocator('iframe')
  await expect(scanner.locator('video')).toHaveCount(1)
  await scanner.locator('#status').click()
  await expect(sheet).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await page.mouse.click(10, 10)
  await expect(sheet).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await trigger.click()
  await expect(scanner.locator('video')).toHaveCount(1)
  await scanner.locator('#status').click()
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('old camera URL redirects to home without starting the camera', async ({
  page,
}) => {
  await page.goto('/scan')
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: /Начать сканировать/ }),
  ).toBeVisible()
})

test('scanner ignores unrelated messages and routes MindAR targetFound once', async ({
  page,
}) => {
  await setScannerLocation(page)
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {})
  })
  await page.goto('/home')
  await page.getByRole('button', { name: /Начать сканировать/ }).click()
  await page.evaluate(() =>
    window.postMessage(
      { type: 'miras:target-found', tag: 'stone-01', entityId: 'kereml' },
      location.origin,
    ),
  )
  await expect(page).toHaveURL(/\/home$/)
  const scanner = page.frameLocator('iframe')
  await scanner.locator('body').evaluate(() => {
    window.parent.postMessage(
      { type: 'miras:target-found', tag: 'stone-01', entityId: 'kereml' },
      location.origin,
    )
  })
  await expect(page.locator('.scanner-captured-banner')).toBeVisible({
    timeout: 30000,
  })
  await page.locator('.scanner-captured-btn').click()
  await expect(page).toHaveURL(/\/encounter\/stone-01/i)
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')

  // They are now on the Encounter page
  await expect(page.getByRole('heading', { name: 'Сила хранителя' })).toBeVisible()

  // Answer the random quiz to enable the start button
  while (!(await page.getByText('Верно!').isVisible())) {
    await page.locator('.quiz-section button').first().click()
    // Wait briefly for state update
    await page.waitForTimeout(100)
  }

  await page.getByRole('button', { name: /Начать испытание/ }).click()
  await expect(page).toHaveURL(/\/fight\/.*kereml/i)
  const fight = page.frameLocator('iframe')
  await fight.locator('body').evaluate(() => {
    window.parent.postMessage(
      {
        type: 'miras:battle-finished',
        result: 'win',
        player: 'su_anasy',
        enemy: 'kremlin',
      },
      location.origin,
    )
  })
  await expect(page).toHaveURL(/\/fight\/.*kereml/i)
  await fight.locator('body').evaluate(() => {
    window.parent.postMessage(
      { type: 'miras:open-collection' },
      location.origin,
    )
  })
  await expect(page).toHaveURL(/\/home$/)
  await expect(
    page.locator('.captive-card', { hasText: 'Казанский Кремль' }),
  ).toHaveCount(0)
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('closing the sheet cancels a late camera permission before exit finishes', async ({
  page,
}) => {
  await setScannerLocation(page)
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      new Promise((resolve) => {
        Object.assign(window, {
          grantCamera: () => {
            const stream = document.createElement('canvas').captureStream()
            Object.assign(window.parent, {
              grantedTrack: stream.getVideoTracks()[0],
            })
            resolve(stream)
          },
        })
      })
  })
  await page.goto('/home')
  await page.getByRole('button', { name: /Начать сканировать/ }).click()
  await expect(page.frameLocator('iframe').locator('video')).toHaveCount(1)
  await page.evaluate(async () => {
    const cameraWindow = document.querySelector('iframe')!
      .contentWindow as unknown as { grantCamera: () => void }
    const close = document.querySelector<HTMLButtonElement>(
      '.scanner-sheet-close',
    )!
    close.click()
    // Deliver the pending permission after the stop message, during the exit animation.
    await new Promise((resolve) => setTimeout(resolve, 50))
    cameraWindow.grantCamera()
  })
  await expect
    .poll(() =>
      page.evaluate(() => {
        return (window as unknown as { grantedTrack: MediaStreamTrack })
          .grantedTrack.readyState
      }),
    )
    .toBe('ended')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('sheet fits narrow screens and respects reduced motion', async ({
  page,
}) => {
  await setScannerLocation(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {})
  })
  await page.goto('/home')
  await page.getByRole('button', { name: /Начать сканировать/ }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toHaveCSS('animation-name', 'none')
  const bounds = (await sheet.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(568)
  await page.screenshot({ path: 'test-results/scanner-sheet.png' })
  await page.getByRole('button', { name: 'Закрыть камеру' }).click()
  await expect(sheet).toHaveCount(0)
})
