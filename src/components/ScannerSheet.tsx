import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Lock, Check } from 'lucide-react'
import { useGame } from '../store/game'
import { getActiveArTarget } from '../api/arTargets'
import type { CharacterId } from '../api/types'

const characterIds: CharacterId[] = [
  'shurale',
  'syuyumbike',
  'su-anasy',
  'kereml',
]

export function ScannerSheet({ onClosed }: { onClosed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const closing = useRef(false)
  const handled = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [isClosing, setIsClosing] = useState(false)
  const run = useGame((state) => state.run)

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    // Release the camera at the start of the exit animation.
    frame.current?.contentWindow?.postMessage(
      { type: 'miras:stop' },
      window.location.origin,
    )
    setIsClosing(true)
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    timer.current = setTimeout(onClosed, reducedMotion ? 0 : 240)
  }, [onClosed])

  useEffect(() => {
    const element = dialog.current!
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!element.open) element.showModal()
    element
      .querySelector<HTMLButtonElement>('button')
      ?.focus({ preventScroll: true })
    return () => {
      clearTimeout(timer.current)
      element.close()
      document.body.style.overflow = overflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [])

  const [capturedSpirit, setCapturedSpirit] = useState<CharacterId | null>(null)
  const entities = useGame((state) => state.entities)

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        closing.current
      )
        return
      if (event.data?.type === 'miras:close') close()
      if (
        event.data?.type === 'miras:target-found' &&
        characterIds.includes(event.data?.entityId) &&
        !handled.current
      ) {
        handled.current = true
        const targetId = event.data.entityId as CharacterId
        const starterId: CharacterId =
          targetId === 'su-anasy' ? 'shurale' : 'su-anasy'
        let state = useGame.getState()
        if (!state.progress.collection.some((item) => item.id === starterId)) {
          await run({
            type: 'capture',
            characterId: starterId,
          })
          state = useGame.getState()
        }
        await run({
          type: 'capture',
          characterId: targetId,
        })
        setCapturedSpirit(targetId)
        setTimeout(() => {
          close()
        }, 1800)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [close, run])

  return (
    <dialog
      ref={dialog}
      className={`scanner-sheet${isClosing ? ' is-closing' : ''}`}
      aria-label="Сканировать место"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <div className="scanner-sheet-content">
        <iframe
          ref={frame}
          src="/ar/index.html"
          title="AR-сканер меток"
          allow="camera; accelerometer; gyroscope"
          onLoad={() => {
            void getActiveArTarget().then((target) => {
              if (!closing.current)
                frame.current?.contentWindow?.postMessage(
                  { type: 'miras:start', target },
                  window.location.origin,
                )
            })
          }}
        />
        {capturedSpirit && (
          <div
            className="scanner-captured-banner"
            role="status"
            aria-live="polite"
          >
            <div className="scanner-captured-badge">
              <Lock size={12} /> В плену!
            </div>
            <h2>
              {entities.find((e) => e.id === capturedSpirit)?.name ?? 'Дух'}{' '}
              заточён!
            </h2>
            <p>
              Хранитель добавлен в темницу на главной странице. Выбери его,
              чтобы сразиться.
            </p>
            <button
              type="button"
              className="scanner-captured-btn"
              onClick={close}
            >
              <Check size={14} /> Перейти к пленникам
            </button>
          </div>
        )}
        <button
          type="button"
          className="scanner-sheet-close"
          onClick={close}
          aria-label="Закрыть камеру"
        >
          <X size={20} />
        </button>
      </div>
    </dialog>
  )
}
