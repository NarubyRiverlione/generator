import '../styles/illuminated-button.css'

type Props = {
  label: string
  active: boolean
  inhibited: boolean
  onToggle: () => void
}

export function IlluminatedButton({ label, active, inhibited, onToggle }: Props) {
  function handleClick() {
    if (!inhibited) onToggle()
  }

  const lightClass = inhibited ? 'illuminated-btn-light--amber' : active ? 'illuminated-btn-light--green' : ''

  return (
    <div className="illuminated-btn-wrap">
      <button
        className={`illuminated-btn${inhibited ? ' illuminated-btn--inhibited' : ''}`}
        onClick={handleClick}
        aria-pressed={!inhibited && active}
      >
        <span className={`illuminated-btn-light ${lightClass}`} />
      </button>
      <span className="illuminated-btn-label">{label}</span>
    </div>
  )
}
