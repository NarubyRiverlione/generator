/** SelectorSwitch — generic on/off rotary selector. */

type Props = {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

export function SelectorSwitch({ label, value, onChange }: Props) {
  return (
    <div className="avr-section">
      <div className="sel-wrap">
        <div className="card" style={{ marginBottom: 8 }}>{label}</div>
        <div className="sel-positions">
          <span>0</span>
          <span>1</span>
        </div>
        <button
          className="sel-switch"
          onClick={() => onChange(!value)}
          aria-pressed={value}
          title={value ? `${label} ON — click to turn off` : `${label} OFF — click to turn on`}
        >
          <div
            className="sel-face"
            style={{ transform: `rotate(${value ? 45 : -45}deg)` }}
          >
            <div className="sel-bar" />
          </div>
        </button>
      </div>

    </div>
  )
}
