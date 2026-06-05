export function startTimer(): number {
  return Date.now()
}

export function endTimer(startTime: number): number {
  return Date.now() - startTime
}
