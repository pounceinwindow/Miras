import { startImageTracking } from './lib/start-image-tracking.js'

const start = document.querySelector('#start')
const status = document.querySelector('#status')
const hint = document.querySelector('#hint')
let session = null
let pending = null
let found = false
let libraries = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = () => {
      script.remove()
      reject(
        new Error(
          'Не удалось загрузить сканер. Проверь соединение и попробуй ещё раз.',
        ),
      )
    }
    document.head.append(script)
  })
}
function loadLibraries() {
  if (!libraries)
    libraries = (async () => {
      if (!window.AFRAME) await loadScript('./vendor/aframe.min.js')
      if (!window.AFRAME.systems['mindar-image-system'])
        await loadScript('./vendor/mindar-image-aframe.prod.js')
    })().catch((error) => {
      libraries = null
      throw error
    })
  return libraries
}
function closeSession() {
  pending?.abort()
  pending = null
  session?.stop()
  session = null
  document.body.classList.remove('camera-ready')
  start.disabled = false
  start.hidden = false
}
async function startCamera() {
  if (pending || session) return
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    start.hidden = false
    status.textContent = 'Камера недоступна'
    hint.textContent =
      'Открой сайт по HTTPS или через localhost, чтобы включить камеру.'
    return
  }
  const controller = new AbortController()
  pending = controller
  found = false
  start.disabled = true
  start.hidden = true
  status.textContent = 'Подготавливаем камеру…'
  hint.textContent = 'Разреши доступ к камере в запросе браузера.'
  try {
    await loadLibraries()
    controller.signal.throwIfAborted()
    const response = await fetch('./assets/target.mind', {
      signal: controller.signal,
    })
    if (!response.ok)
      throw new Error('Не удалось загрузить метку. Попробуй ещё раз.')
    const mind = await response.blob()
    const result = await startImageTracking({
      container: document.querySelector('#camera'),
      mind,
      targets: [
        { targetIndex: 0, locationId: 'forest-01', entityId: 'shurale' },
      ],
      signal: controller.signal,
      onFound(target) {
        if (found || controller.signal.aborted) return
        found = true
        status.textContent = 'Легенда найдена!'
        // Stop before navigating so no camera stream survives the encounter.
        closeSession()
        window.parent.postMessage(
          { type: 'miras:target-found', tag: target.locationId },
          window.location.origin,
        )
      },
    })
    if (controller.signal.aborted) {
      result.stop()
      return
    }
    session = result
    document.body.classList.add('camera-ready')
    pending = null
    start.hidden = true
    status.textContent = 'Ищем легенду…'
    hint.textContent =
      'Наведи камеру на тестовую метку и держи её целиком в рамке.'
  } catch (error) {
    if (controller.signal.aborted) return
    closeSession()
    status.textContent = 'Не удалось включить камеру'
    hint.textContent =
      error.message ||
      'Проверь разрешение камеры в настройках браузера и попробуй ещё раз.'
  }
}
start.addEventListener('click', startCamera)
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent)
    return
  if (event.data?.type === 'miras:start') void startCamera()
  if (event.data?.type === 'miras:stop') closeSession()
})
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSession()
    window.parent.postMessage({ type: 'miras:close' }, window.location.origin)
  }
})
window.addEventListener('pagehide', closeSession)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    closeSession()
    status.textContent = 'Камера приостановлена'
    hint.textContent = 'Нажми «Включить камеру», чтобы продолжить.'
  }
})
