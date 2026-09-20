import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  LoaderCircle,
  Lock,
  RotateCcw,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArTargetsError, getArBundle, type ArBundle } from '../api/arTargets'
import type { CharacterId } from '../api/types'
import { handleSuccessfulScan } from '../game/handleSuccessfulScan'
import { useGame } from '../store/game'

const characterIds: CharacterId[] = [
  'shurale',
  'syuyumbike',
  'su-anasy',
  'kereml',
]

function scannerErrorMessage(error: unknown) {
  if (error instanceof ArTargetsError) return error.message
  return 'Не удалось загрузить AR-метки. Проверь интернет и повтори.'
}

export function ScannerSheet({ onClosed }: { onClosed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const closing = useRef(false)
  const handled = useRef(false)
  const requestId = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const startupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const [isClosing, setIsClosing] = useState(false)
  const [bundle, setBundle] = useState<ArBundle | null>(null)
  const [scannerGate, setScannerGate] = useState<{
    state: 'checking' | 'error'
    message: string
  }>({ state: 'checking', message: 'Подготавливаем сканер…' })
  const [capturedSpirit, setCapturedSpirit] = useState<CharacterId | null>(null)
  const entities = useGame((state) => state.entities)
  const navigate = useNavigate()

  const prepareScanner = useCallback(async () => {
    const currentRequest = ++requestId.current
    setBundle(null)
    setScannerGate({
      state: 'checking',
      message: 'Подготавливаем сканер…',
    })
    try {
      const arBundle = await getArBundle()
      if (closing.current || requestId.current !== currentRequest) return
      setBundle(arBundle)
    } catch (error) {
      if (closing.current || requestId.current !== currentRequest) return
      setScannerGate({ state: 'error', message: scannerErrorMessage(error) })
    }
  }, [])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    requestId.current += 1
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
    startupTimer.current = setTimeout(() => void prepareScanner(), 0)
    return () => {
      requestId.current += 1
      clearTimeout(startupTimer.current)
      clearTimeout(timer.current)
      element.close()
      document.body.style.overflow = overflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [prepareScanner])

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
        const tag = await handleSuccessfulScan(targetId)
        setCapturedSpirit(targetId)
        setTimeout(() => {
          close()
          if (tag) setTimeout(() => navigate(`/encounter/${tag}`), 240)
        }, 1800)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [close, navigate])

  return (
    <dialog
      ref={dialog}
      className={`scanner-sheet${isClosing ? ' is-closing' : ''}`}
      aria-label="Сканировать место"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close()
      }}
    >
      <div className="scanner-sheet-content">
        {bundle ? (
          <iframe
            ref={frame}
            src="/ar/index.html"
            title="AR-сканер меток"
            allow="camera; accelerometer; gyroscope"
            onLoad={() => {
              if (!closing.current)
                frame.current?.contentWindow?.postMessage(
                  { type: 'miras:start', bundle },
                  window.location.origin,
                )
            }}
          />
        ) : (
          <div className="scanner-location-gate" role="status">
            <div className="scanner-location-icon" aria-hidden="true">
              {scannerGate.state === 'checking' ? (
                <LoaderCircle className="scanner-location-spinner" size={30} />
              ) : (
                <AlertCircle size={30} />
              )}
            </div>
            <h2>
              {scannerGate.state === 'checking'
                ? 'Загружаем AR-метки'
                : 'Сканирование недоступно'}
            </h2>
            <p>{scannerGate.message}</p>
            {scannerGate.state === 'error' && (
              <button type="button" onClick={() => void prepareScanner()}>
                <RotateCcw size={16} /> Повторить
              </button>
            )}
          </div>
        )}
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
              {entities.find((entity) => entity.id === capturedSpirit)?.name ??
                'Дух'}{' '}
              заточён!
            </h2>
            <p>
              Хранитель добавлен в темницу на главной странице. Выбери его,
              чтобы сразиться.
            </p>
            <button
              type="button"
              className="scanner-captured-btn"
              onClick={() => {
                const tag = entities.find(
                  (entity) => entity.id === capturedSpirit,
                )?.tag
                close()
                if (tag) setTimeout(() => navigate(`/encounter/${tag}`), 240)
              }}
            >
              <Check size={14} /> Читать историю и сразиться
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
