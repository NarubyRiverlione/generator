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


type Props = { onCommand: (cmd: ValveCommand) => void }

export function SpringLoadedSelector({ onCommand }: Props) {
  const [active, setActive] = useState<ValveCommand>(0)

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const { offsetX, offsetY } = e.nativeEvent
    const { offsetWidth, offsetHeight } = e.currentTarget
    const left = offsetX < offsetWidth / 2
    const top = offsetY < offsetHeight / 2
    const cmd: ValveCommand = left
      ? (top ? -1 : -2)
      : (top ?  1 :  2)
    setActive(cmd)
    onCommand(cmd)
  }

  function handleRelease() {
    setActive(0)
    onCommand(0)
  }

  const ptrRotation = CMD_ANGLE[active]

  return (
    <div className="knob-wrap">
      <div className="card">GOVERNOR</div>
      <div
        className="knob-hitbox knob-clickable"
        onMouseDown={handleMouseDown}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={(e) => {
          e.preventDefault()
          const t = e.touches[0]
          const rect = e.currentTarget.getBoundingClientRect()
          const left = t.clientX - rect.left < rect.width / 2
          const top = t.clientY - rect.top < rect.height / 2
          const cmd: ValveCommand = left ? (top ? -1 : -2) : (top ? 1 : 2)
          setActive(cmd)
          onCommand(cmd)
        }}
        onTouchEnd={handleRelease}
        onTouchCancel={handleRelease}
        role="slider"
        aria-label="Governor speed-changer"
        aria-valuemin={-2}
        aria-valuemax={2}
        aria-valuenow={active}
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
      <div className="scale" style={{ visibility: 'hidden' }}><span>{' '}</span><span>{' '}</span></div>
      <div className="plate" style={{ visibility: 'hidden' }}>-</div>
      <div className="locktag" style={{ visibility: 'hidden' }}>{' '}</div>
    </div>
  )
}
