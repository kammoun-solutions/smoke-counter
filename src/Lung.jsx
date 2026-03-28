const FULL_RECOVERY_MS = 24 * 60 * 60 * 1000 // 24 hours to full

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpColor(t) {
  // 0% = damaged grey-brown, 100% = healthy pink
  const r = Math.round(lerp(80, 232, t))
  const g = Math.round(lerp(65, 134, t))
  const b = Math.round(lerp(60, 156, t))
  return `rgb(${r},${g},${b})`
}

function glowColor(t) {
  const r = Math.round(lerp(80, 232, t))
  const g = Math.round(lerp(65, 134, t))
  const b = Math.round(lerp(60, 156, t))
  return `rgba(${r},${g},${b},${0.15 + t * 0.25})`
}

export default function Lung({ elapsedMs }) {
  const pct = elapsedMs === null
    ? 1
    : Math.min(1, Math.max(0, elapsedMs / FULL_RECOVERY_MS))

  const fillY = 300 - pct * 300 // SVG is 300 tall, fill rises from bottom
  const color = lerpColor(pct)
  const glow = glowColor(pct)
  const pctLabel = Math.round(pct * 100)

  return (
    <div className="lung-wrap">
      <svg
        viewBox="0 0 240 300"
        width="240"
        height="300"
        className="lung-svg"
        aria-label={`Lung health: ${pctLabel}%`}
      >
        <defs>
          <clipPath id="lung-clip">
            {/* Left lung */}
            <path d="M95 60 C95 60, 85 55, 75 65 C55 85, 35 120, 30 160 C25 200, 28 235, 45 255 C55 268, 70 272, 85 268 C95 265, 100 255, 100 245 L100 80 C100 70, 98 62, 95 60Z" />
            {/* Right lung */}
            <path d="M145 60 C145 60, 155 55, 165 65 C185 85, 205 120, 210 160 C215 200, 212 235, 195 255 C185 268, 170 272, 155 268 C145 265, 140 255, 140 245 L140 80 C140 70, 142 62, 145 60Z" />
            {/* Trachea / bronchi */}
            <path d="M112 15 L112 70 C112 75, 108 80, 100 85 L100 75 C106 72, 108 68, 108 65 L108 15Z" />
            <path d="M128 15 L128 70 C128 75, 132 80, 140 85 L140 75 C134 72, 132 68, 132 65 L132 15Z" />
            <rect x="108" y="10" width="24" height="12" rx="4" />
          </clipPath>
        </defs>

        {/* Background (damaged lung) */}
        <g clipPath="url(#lung-clip)">
          <rect x="0" y="0" width="240" height="300" fill="#2a2220" />
          {/* Healthy fill rising from bottom */}
          <rect
            x="0"
            y={fillY}
            width="240"
            height={300 - fillY}
            fill={color}
            style={{ transition: 'y 1s ease, height 1s ease, fill 2s ease' }}
          />
        </g>

        {/* Outline */}
        {/* Left lung */}
        <path
          d="M95 60 C95 60, 85 55, 75 65 C55 85, 35 120, 30 160 C25 200, 28 235, 45 255 C55 268, 70 272, 85 268 C95 265, 100 255, 100 245 L100 80 C100 70, 98 62, 95 60Z"
          fill="none" stroke="#333" strokeWidth="1.5"
        />
        {/* Right lung */}
        <path
          d="M145 60 C145 60, 155 55, 165 65 C185 85, 205 120, 210 160 C215 200, 212 235, 195 255 C185 268, 170 272, 155 268 C145 265, 140 255, 140 245 L140 80 C140 70, 142 62, 145 60Z"
          fill="none" stroke="#333" strokeWidth="1.5"
        />
        {/* Trachea */}
        <path d="M112 15 L112 70 C112 75, 108 80, 100 80" fill="none" stroke="#333" strokeWidth="1.5" />
        <path d="M128 15 L128 70 C128 75, 132 80, 140 80" fill="none" stroke="#333" strokeWidth="1.5" />
        <rect x="108" y="10" width="24" height="12" rx="4" fill="none" stroke="#333" strokeWidth="1.5" />
      </svg>

      <div className="lung-glow" style={{ background: glow }} />
      <div className="lung-pct">{pctLabel}%</div>
      <div className="lung-label">
        {pct >= 1 ? 'Fully recovered' : pct >= 0.75 ? 'Almost there' : pct >= 0.5 ? 'Healing' : pct >= 0.25 ? 'Recovering' : pct > 0 ? 'Damaged' : 'Just smoked'}
      </div>
    </div>
  )
}
