export interface ProjectReview {
  roast: string
  review: string
  strengths: unknown[]
  weaknesses: unknown[]
  suggestions: unknown[]
  score: number
  category?: string
}

export interface ResumeReview {
  roast: string
  score: number
  suggestions: unknown[]
}

export function validateProjectReview(parsed: unknown): parsed is ProjectReview {
  if (!parsed || typeof parsed !== 'object') return false
  const obj = parsed as Record<string, unknown>
  const { roast, review, strengths, weaknesses, suggestions, score } = obj

  if (typeof roast !== 'string' || !roast) return false
  if (typeof review !== 'string' || !review) return false
  if (!Array.isArray(strengths)) return false
  if (!Array.isArray(weaknesses)) return false
  if (!Array.isArray(suggestions)) return false
  if (typeof score !== 'number' || isNaN(score)) return false

  return true
}

export function validateResumeReview(parsed: unknown): parsed is ResumeReview {
  if (!parsed || typeof parsed !== 'object') return false
  const obj = parsed as Record<string, unknown>
  const { roast, score, suggestions } = obj

  if (typeof roast !== 'string' || !roast) return false
  if (typeof score !== 'number' || isNaN(score)) return false
  if (!Array.isArray(suggestions)) return false

  return true
}
