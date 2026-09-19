import { Link } from 'react-router-dom'
import { MapPin, Navigation } from 'lucide-react'
import { useGame } from '../store/game'
const positions = [
  { left: '26%', top: '31%' },
  { left: '66%', top: '22%' },
  { left: '48%', top: '67%' },
  { left: '77%', top: '56%' },
]
export function MapScene() {
  const characters = useGame((s) => s.entities)
  const owned = useGame((s) => s.progress.collection)
  return (
    <div className="map-scene">
      <svg
        viewBox="0 0 800 480"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M42 0H0V42"
              fill="none"
              stroke="#d9e1cf"
              strokeWidth=".8"
            />
          </pattern>
        </defs>
        <rect width="800" height="480" fill="#edf0e4" />
        <rect width="800" height="480" fill="url(#grid)" />
        <path
          d="M-20 380Q140 210 265 311T510 354Q642 269 830 422"
          fill="none"
          stroke="#bdd6d1"
          strokeWidth="93"
        />
        <path
          d="M-20 380Q140 210 265 311T510 354Q642 269 830 422"
          fill="none"
          stroke="#d2e6dc"
          strokeWidth="2"
        />
        <g fill="#d5dfbf">
          <ellipse cx="190" cy="115" rx="120" ry="72" />
          <ellipse cx="100" cy="222" rx="91" ry="50" />
          <ellipse cx="649" cy="419" rx="98" ry="55" />
          <ellipse cx="403" cy="52" rx="80" ry="57" />
        </g>
        <g stroke="#fffdf4" strokeWidth="15" fill="none">
          <path d="M-30 256L740 80M330-20L451 500M50 476L277 180 270-20M570-20L566 225 818 289M4 57L267 180 557 227 767 474" />
        </g>
        <g stroke="#cbbf9e" strokeWidth="2" fill="none" strokeDasharray="5 7">
          <path d="M199 147Q389 66 530 111T617 269Q612 348 380 330" />
        </g>
        <g fill="#c9d3b4" stroke="#b6c59f" strokeWidth="2">
          {[
            [76, 90],
            [109, 114],
            [131, 65],
            [210, 70],
            [148, 189],
            [79, 209],
            [680, 420],
            [705, 448],
            [633, 437],
            [412, 27],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y - 20}l-14 27h28Z`} />
          ))}
        </g>
        <g fill="#d6c9ac" stroke="#c1b28e" strokeWidth="1.5">
          <path d="M496 73h61v50h-61Z" />
          <path d="M490 67h11v17h-11ZM517 62h13v22h-13ZM548 67h13v17h-13Z" />
          <path d="M605 240h54v42h-54ZM613 228h12v16h-12ZM640 228h12v16h-12Z" />
        </g>
        <g
          fill="#788773"
          fontSize="12"
          fontFamily="system-ui"
          letterSpacing="2"
        >
          <text x="73" y="166">
            ЛЕСНАЯ ТРОПА
          </text>
          <text x="544" y="56">
            КРЕМЛЬ
          </text>
          <text x="266" y="391" fill="#688f89">
            ОЗЕРО
          </text>
        </g>
      </svg>
      <div className="map-badge">
        <span className="live-dot" /> Маршрут легенд
      </div>
      {characters.map((c, i) => (
        <Link
          key={c.id}
          to={`/encounter/${c.tag}`}
          className={`map-pin pin-${c.id}`}
          style={positions[i]}
          aria-label={`Встретить: ${c.name}`}
        >
          <MapPin size={21} />
          <span>
            {c.name}
            {owned.some((o) => o.id === c.id) ? ' ✓' : ''}
          </span>
        </Link>
      ))}
      <span className="map-position">
        <Navigation size={18} fill="currentColor" />
      </span>
      <span className="map-note">Схема для демо · не геолокация</span>
    </div>
  )
}
