import type { CharacterLine } from '../api/types'

interface CharacterSpeechProps {
  line: CharacterLine
  label?: string
  tone?: 'paper' | 'battle'
  placement?: 'inline' | 'hero'
  visible?: boolean
  characterSide?: 'left' | 'right'
  onExitComplete?: () => void
}

export function CharacterSpeech({
  line,
  label,
  tone = 'paper',
  placement = 'inline',
  visible = true,
  characterSide = 'right',
  onExitComplete,
}: CharacterSpeechProps) {
  return (
    <blockquote
      className={`character-speech character-speech--${tone} character-speech--${placement} character-speech--from-${characterSide} ${visible ? 'is-visible' : 'is-closing'}`}
      aria-hidden={!visible}
      onAnimationEnd={(event) => {
        if (!visible && event.animationName === 'character-speech-exit') {
          onExitComplete?.()
        }
      }}
    >
      <div className="character-speech-bubble">
        {label && <span className="character-speech-label">{label}</span>}
        <p lang="tt">{line.tatar}</p>
        <footer>{line.russian}</footer>
      </div>
    </blockquote>
  )
}
