/**
 * SpringLoadedSelector — spring-return governor speed-changer.
 * Same knob-wrap layout as Knob; ptr snaps back to 0° (12 o'clock) on release.
 * Click zones mirror the Knob convention:
 *   top-left = slow lower (▼), bottom-left = fast lower (▼▼)
 *   top-right = slow raise (▲), bottom-right = fast raise (▲▲)
 */

import { useState } from 'react'
import { GovernorTicks } from './Knob'
import type { ValveCommand } from '../core/types'

// cmd → pointer rotation (matches KnobTicks: ticks at −65°, 0°, +65°, +130°)
const CMD_ANGLE: Record<ValveCommand, number> = { [-2]: -130, [-1]: -65, [0]: 0, [1]: 65, [2]: 130 }

type Props = {
  label?: string
  onCommand: (cmd: ValveCommand) => void
  readOnly?: boolean
  lockLabel?: string
}

export function SpringLoadedSelector({ label = 'GOVERNOR', onCommand, readOnly = false, lockLabel }: Props) {
  const [active, setActive] = useState<ValveCommand>(0)

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return
    const { offsetX, offsetY } = e.nativeEvent
    const { offsetWidth, offsetHeight } = e.currentTarget
    const left = offsetX < offsetWidth / 2
    const top = offsetY < offsetHeight / 2
    const cmd: ValveCommand = left ? (top ? -1 : -2) : top ? 1 : 2
    setActive(cmd)
    onCommand(cmd)
  }

  function handleRelease() {
    if (readOnly) return
    setActive(0)
    onCommand(0)
  }

  const ptrRotation = CMD_ANGLE[readOnly ? 0 : active]

  return (
    <div className="knob-wrap">
      <div className="card">{label}</div>
      <div
        className={`knob-hitbox${readOnly ? '' : ' knob-clickable'}`}
        style={readOnly ? { cursor: 'default' } : undefined}
        onMouseDown={handleMouseDown}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={(e) => {
          if (readOnly) return
          e.preventDefault()
          const t = e.touches[0]
          const rect = e.currentTarget.getBoundingClientRect()
          const left = t.clientX - rect.left < rect.width / 2
          const top = t.clientY - rect.top < rect.height / 2
          const cmd: ValveCommand = left ? (top ? -1 : -2) : top ? 1 : 2
          setActive(cmd)
          onCommand(cmd)
        }}
        onTouchEnd={handleRelease}
        onTouchCancel={handleRelease}
        role="slider"
        aria-label={`${label} speed-changer`}
        aria-valuemin={-2}
        aria-valuemax={2}
        aria-valuenow={readOnly ? 0 : active}
        tabIndex={0}
      >
        <GovernorTicks />
        <span className="knob-corner tl">▼</span>
        <span className="knob-corner tr">▲</span>
        <div className="knob">
          <div className="ptr" style={{ transform: `rotate(${ptrRotation}deg)` }} />
          <div className="hub" />
        </div>
        <span className="knob-corner bl">▼▼</span>
        <span className="knob-corner br">▲▲</span>
      </div>
      {/* invisible spacers — match scale + plate + locktag height on Knob so alignSelf:center lands at the same knob height */}
      <div className="scale" style={{ visibility: 'hidden' }}>
        <span>{' '}</span>
        <span>{' '}</span>
      </div>
      <div className="plate" style={{ visibility: 'hidden' }}>
        -
      </div>
      <div className="locktag" style={{ visibility: lockLabel ? 'visible' : 'hidden' }}>
        {lockLabel ?? ' '}
      </div>
    </div>
  )
}
