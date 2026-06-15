/** Minimal complex arithmetic for phasor calculations. */

export type Complex = { re: number; im: number }

export function cx(re: number, im: number): Complex {
  return { re, im }
}

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

export function sub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im }
}

export function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}

export function div(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom }
}

export function abs(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im)
}

export function arg(a: Complex): number {
  return Math.atan2(a.im, a.re)
}
