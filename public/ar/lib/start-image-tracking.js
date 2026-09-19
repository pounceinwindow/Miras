// Adapted from mindar-image-spike. MindAR start() is event-based, not a Promise.
// Resolve only on arReady; clean up even when permission is denied or startup is cancelled.
export async function startImageTracking({
  container,
  mind,
  targets,
  onFound,
  onLost = () => {},
  signal,
}) {
  if (!(container instanceof HTMLElement))
    throw new TypeError('Не найден контейнер камеры')
  signal?.throwIfAborted()
  const url = URL.createObjectURL(
    mind instanceof Blob ? mind : new Blob([mind]),
  )
  const scene = document.createElement('a-scene')
  scene.setAttribute('embedded', '')
  scene.setAttribute(
    'mindar-image',
    `imageTargetSrc: ${url}; autoStart: false; uiLoading: no; uiScanning: no; uiError: no; maxTrack: 1; warmupTolerance: 15; missTolerance: 5`,
  )
  scene.setAttribute(
    'renderer',
    'colorManagement: true; antialias: true; alpha: true',
  )
  scene.setAttribute('vr-mode-ui', 'enabled: false')
  scene.setAttribute('device-orientation-permission-ui', 'enabled: false')
  const camera = document.createElement('a-camera')
  camera.setAttribute('position', '0 0 0')
  camera.setAttribute('look-controls', 'enabled: false')
  scene.append(camera)
  let stopped = false
  for (const target of targets) {
    const anchor = document.createElement('a-entity')
    anchor.setAttribute(
      'mindar-image-target',
      `targetIndex: ${target.targetIndex}`,
    )
    anchor.addEventListener('targetFound', () => {
      if (!stopped) onFound(target)
    })
    anchor.addEventListener('targetLost', () => {
      if (!stopped) onLost(target)
    })
    scene.append(anchor)
  }
  let arSystem
  let timer
  let abortStartup
  function stop() {
    if (stopped) return
    stopped = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortStartup)
    // MindAR's stock stop() assumes a fully initialised controller and stream.
    // Make component removal idempotent and release partial startup resources too.
    if (arSystem) {
      arSystem.stop = () => {}
      arSystem.controller?.stopProcessVideo()
      arSystem.video?.srcObject?.getTracks().forEach((track) => track.stop())
      arSystem.controller?.dispose()
      arSystem.video?.remove()
    }
    scene.remove()
    URL.revokeObjectURL(url)
  }
  try {
    await new Promise((resolve, reject) => {
      abortStartup = () => {
        stop()
        reject(new DOMException('Cancelled', 'AbortError'))
      }
      signal?.addEventListener('abort', abortStartup, { once: true })
      scene.addEventListener(
        'arReady',
        () => {
          clearTimeout(timer)
          if (arSystem?.video) {
            arSystem.video.style.setProperty('z-index', '0', 'important')
            arSystem.video.style.display = 'block'
          }
          scene.renderer?.setClearColor(0x000000, 0)
          scene.renderer?.setClearAlpha(0)
          resolve()
        },
        { once: true },
      )
      scene.addEventListener(
        'arError',
        () =>
          reject(
            new Error(
              'Проверь доступ к камере в настройках браузера. Затем попробуй снова.',
            ),
          ),
        { once: true },
      )
      timer = setTimeout(
        () =>
          reject(
            new Error(
              'Камера не ответила. Проверь разрешение и попробуй ещё раз.',
            ),
          ),
        45000,
      )
      scene.addEventListener(
        'loaded',
        () => {
          if (stopped) return
          arSystem = scene.systems['mindar-image-system']
          if (!arSystem) {
            reject(new Error('Сканер не загрузился. Обнови страницу.'))
            return
          }
          // A delayed camera permission must not restart a cancelled scanner.
          const originalStartAR = arSystem._startAR.bind(arSystem)
          arSystem._startAR = async () => {
            if (stopped) {
              arSystem.video?.srcObject
                ?.getTracks()
                .forEach((track) => track.stop())
              arSystem.video?.remove()
              return
            }
            try {
              await originalStartAR()
              if (stopped) {
                arSystem.controller?.stopProcessVideo()
                arSystem.controller?.dispose()
              }
            } catch (error) {
              reject(error)
            }
          }
          try {
            arSystem.start()
            const video = arSystem.video
            const srcObject = Object.getOwnPropertyDescriptor(
              HTMLMediaElement.prototype,
              'srcObject',
            )
            if (video && srcObject?.set)
              Object.defineProperty(video, 'srcObject', {
                configurable: true,
                get() {
                  return srcObject.get.call(this)
                },
                set(stream) {
                  if (stopped) {
                    stream?.getTracks().forEach((track) => track.stop())
                    return
                  }
                  srcObject.set.call(this, stream)
                },
              })
          } catch (error) {
            reject(error)
          }
        },
        { once: true },
      )
      container.replaceChildren(scene)
    })
    return { stop }
  } catch (error) {
    stop()
    throw error
  }
}
