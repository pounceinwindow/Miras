import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
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
  const navigate = useNavigate()
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
          const outcome = await run({
            type: 'capture',
            characterId: starterId,
          })
          if (outcome !== 'captured') {
            handled.current = false
            return
          }
          state = useGame.getState()
        }
        if (!state.progress.collection.some((item) => item.id === targetId)) {
          const outcome = await run({
            type: 'capture',
            characterId: targetId,
          })
          if (outcome !== 'captured') {
            handled.current = false
            return
          }
        }
        const currentBattle = useGame.getState().progress.battle
        if (currentBattle?.status !== 'active') {
          await run({
            type: 'startBattle',
            characterId: starterId,
            enemyId: targetId,
          })
        }
        if (useGame.getState().progress.battle?.status !== 'active') {
          handled.current = false
          return
        }
        close()
        navigate(`/fight/${starterId}?enemy=${targetId}`)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [close, navigate, run])

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
