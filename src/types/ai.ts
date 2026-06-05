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

export interface IdeaResearchReport {
  startupSummary: string
  marketCategory: string
  competitors: {
    direct: Array<{ name: string; website: string; description: string }>
    indirect: Array<{ name: string; website: string; description: string }>
    alternatives: Array<{ name: string; website: string; description: string }>
  }
  similarStartups: {
    existing: string[]
    acquisitions: string[]
    shutdowns: string[]
  }
  whySimilarFailed: string[]
  whySimilarSucceeded: string[]
  marketOpportunity: {
    opportunityScore: number
    growthIndicators: string[]
    marketMaturity: string
  }
  customerSegments: {
    primary: string
    secondary: string
    earlyAdopters: string
  }
  risks: {
    competition: string
    regulation: string
    technicalComplexity: string
    customerAcquisition: string
    aiCommoditization: string
    capitalRequirements: string
  }
  founderBlindSpots: string[]
  businessModelSuggestions: string[]
  goToMarketStrategy: string[]
  mvpRoadmap: {
    week1: string
    week2: string
    week3: string
    week4: string
  }
  investorReview: {
    vcQuestions: string[]
    fundingRisks: string[]
    defensibilityConcerns: string[]
  }
  recommendation: {
    decision: 'Build' | 'Pivot' | 'Avoid'
    reasoning: string
  }
  sources: Array<{ sourceTitle: string; sourceUrl: string; summary: string }>
}

export function validateProjectReview(parsed: unknown): parsed is ProjectReview {
  if (!parsed || typeof parsed !== 'object') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = parsed as Record<string, any>
  
  // Defensive type coercion for score
  if (typeof obj.score === 'string') {
    const num = Number(obj.score)
    if (!isNaN(num)) {
      obj.score = num
    }
  }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = parsed as Record<string, any>
  
  // Defensive type coercion for score
  if (typeof obj.score === 'string') {
    const num = Number(obj.score)
    if (!isNaN(num)) {
      obj.score = num
    }
  }

  const { roast, score, suggestions } = obj

  if (typeof roast !== 'string' || !roast) return false
  if (typeof score !== 'number' || isNaN(score)) return false
  if (!Array.isArray(suggestions)) return false

  return true
}

export function validateIdeaResearchReport(parsed: unknown): parsed is IdeaResearchReport {
  if (!parsed || typeof parsed !== 'object') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = parsed as Record<string, any>

  // Normalize opportunity score if string
  if (obj.marketOpportunity && typeof obj.marketOpportunity === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opp = obj.marketOpportunity as Record<string, any>
    if (typeof opp.opportunityScore === 'string') {
      const num = Number(opp.opportunityScore)
      if (!isNaN(num)) {
        opp.opportunityScore = num
      }
    }
  }

  if (typeof obj.startupSummary !== 'string' || !obj.startupSummary) return false
  if (typeof obj.marketCategory !== 'string' || !obj.marketCategory) return false
  
  if (!obj.competitors || typeof obj.competitors !== 'object') return false
  const comp = obj.competitors
  if (!Array.isArray(comp.direct) || !Array.isArray(comp.indirect) || !Array.isArray(comp.alternatives)) return false

  if (!obj.similarStartups || typeof obj.similarStartups !== 'object') return false
  const sim = obj.similarStartups
  if (!Array.isArray(sim.existing) || !Array.isArray(sim.acquisitions) || !Array.isArray(sim.shutdowns)) return false

  if (!Array.isArray(obj.whySimilarFailed)) return false
  if (!Array.isArray(obj.whySimilarSucceeded)) return false

  if (!obj.marketOpportunity || typeof obj.marketOpportunity !== 'object') return false
  const opp = obj.marketOpportunity
  if (typeof opp.opportunityScore !== 'number' || isNaN(opp.opportunityScore)) return false
  if (!Array.isArray(opp.growthIndicators)) return false
  if (typeof opp.marketMaturity !== 'string' || !opp.marketMaturity) return false

  if (!obj.customerSegments || typeof obj.customerSegments !== 'object') return false
  const cust = obj.customerSegments
  if (typeof cust.primary !== 'string' || typeof cust.secondary !== 'string' || typeof cust.earlyAdopters !== 'string') return false

  if (!obj.risks || typeof obj.risks !== 'object') return false
  const rsk = obj.risks
  if (typeof rsk.competition !== 'string' || typeof rsk.regulation !== 'string' ||
      typeof rsk.technicalComplexity !== 'string' || typeof rsk.customerAcquisition !== 'string' ||
      typeof rsk.aiCommoditization !== 'string' || typeof rsk.capitalRequirements !== 'string') return false

  if (!Array.isArray(obj.founderBlindSpots)) return false
  if (!Array.isArray(obj.businessModelSuggestions)) return false
  if (!Array.isArray(obj.goToMarketStrategy)) return false

  if (!obj.mvpRoadmap || typeof obj.mvpRoadmap !== 'object') return false
  const mvp = obj.mvpRoadmap
  if (typeof mvp.week1 !== 'string' || typeof mvp.week2 !== 'string' ||
      typeof mvp.week3 !== 'string' || typeof mvp.week4 !== 'string') return false

  if (!obj.investorReview || typeof obj.investorReview !== 'object') return false
  const inv = obj.investorReview
  if (!Array.isArray(inv.vcQuestions) || !Array.isArray(inv.fundingRisks) || !Array.isArray(inv.defensibilityConcerns)) return false

  if (!obj.recommendation || typeof obj.recommendation !== 'object') return false
  const rec = obj.recommendation
  if (rec.decision !== 'Build' && rec.decision !== 'Pivot' && rec.decision !== 'Avoid') return false
  if (typeof rec.reasoning !== 'string' || !rec.reasoning) return false

  if (!Array.isArray(obj.sources)) return false

  return true
}
