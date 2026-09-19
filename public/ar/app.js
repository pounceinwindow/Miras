import { startImageTracking } from './lib/start-image-tracking.js'

const start = document.querySelector('#start')
const status = document.querySelector('#status')
const hint = document.querySelector('#hint')
let session = null
let pending = null
let found = false
let libraries = null
let confirmationTimer = null
let armTimer = null
let armed = false
let targetVisible = false
let activeBundle = {
  mindPath: '/ar/assets/target.mind',
  targets: [
    {
      targetIndex: 0,
      locationId: 'stone-01',
      entityId: 'kereml',
    },
  ],
}

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
  clearTimeout(confirmationTimer)
  confirmationTimer = null
  clearTimeout(armTimer)
  armTimer = null
  armed = false
  targetVisible = false
  if (!pending && !session) return
  console.warn('[miras] closeSession called', new Error().stack)
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
  armed = false
  targetVisible = false
  start.disabled = true
  start.hidden = true
  status.textContent = 'Подготавливаем камеру…'
  hint.textContent = 'Разреши доступ к камере в запросе браузера.'
  try {
    await loadLibraries()
    controller.signal.throwIfAborted()
    let mind = activeBundle.mind
    if (!(mind instanceof Blob)) {
      const response = await fetch(activeBundle.mindPath, {
        signal: controller.signal,
      })
      if (!response.ok)
        throw new Error('Не удалось загрузить метку. Попробуй ещё раз.')
      mind = await response.blob()
    }
    const result = await startImageTracking({
      container: document.querySelector('#camera'),
      mind,
      targets: activeBundle.targets,
      signal: controller.signal,
      onFound(target) {
        if (found || controller.signal.aborted) return
        targetVisible = true
        if (!armed) return
        clearTimeout(confirmationTimer)
        status.textContent = 'Метка найдена — удерживай…'
        hint.textContent = 'Не убирай метку из рамки ещё полторы секунды.'
        confirmationTimer = setTimeout(() => {
          if (found || controller.signal.aborted) return
          found = true
          status.textContent = 'Легенда найдена!'
          closeSession()
          window.parent.postMessage(
            {
              type: 'miras:target-found',
              tag: target.locationId,
              entityId: target.entityId,
            },
            window.location.origin,
          )
        }, 1500)
      },
      onLost() {
        if (found || controller.signal.aborted) return
        targetVisible = false
        clearTimeout(confirmationTimer)
        confirmationTimer = null
        status.textContent = 'Ищем легенду…'
        hint.textContent =
          'Наведи камеру на тестовую метку и держи её целиком в рамке.'
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
    armTimer = setTimeout(() => {
      armed = true
      if (targetVisible) {
        status.textContent = 'Камера готова'
        hint.textContent =
          'Отведи камеру от метки, затем наведи её снова для распознавания.'
      }
    }, 1200)
  } catch (error) {
    if (controller.signal.aborted) return
    console.error('startCamera error:', error)
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
  if (event.data?.type === 'miras:start') {
    if (event.data.bundle) activeBundle = event.data.bundle
    else if (event.data.target)
      activeBundle = {
        mindPath: event.data.target.mindPath,
        targets: [
          {
            targetIndex: 0,
            locationId: event.data.target.tag,
            entityId: event.data.target.entityId,
          },
        ],
      }
    void startCamera()
  }
  if (event.data?.type === 'miras:stop') closeSession()
})
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSession()
    window.parent.postMessage({ type: 'miras:close' }, window.location.origin)
  }
})
window.addEventListener('beforeunload', closeSession)
