export function classifyGeminiError(err: unknown): { errorType: string; errorMessage: string } {
  const errorObj = err as { message?: string; status?: number; response?: { status?: number }; code?: string } | null | undefined
  const message = errorObj?.message || String(err)
  const status = errorObj?.status || errorObj?.response?.status || 0
  
  let errorType = 'UNKNOWN'
  
  if (message.includes('timeout') || message.includes('timed out') || errorObj?.code === 'ETIMEDOUT') {
    errorType = 'TIMEOUT'
  } else if (status === 404 || message.includes('not found') || message.includes('not supported') || message.includes('Model')) {
    errorType = 'INVALID_MODEL'
  } else if (status === 403 || message.includes('API key not valid') || message.includes('API_KEY_INVALID') || message.includes('API key expired') || message.includes('invalid api key')) {
    errorType = 'INVALID_API_KEY'
  } else if (
    status === 429 ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Resource has been exhausted') ||
    message.includes('Quota exceeded') ||
    message.includes('quota exceeded') ||
    message.includes('rate limit') ||
    message.includes('Rate limit')
  ) {
    if (message.includes('quota') || message.includes('Quota') || message.includes('exhausted') || message.includes('EXHAUSTED')) {
      errorType = 'QUOTA_EXCEEDED'
    } else {
      errorType = 'RATE_LIMIT'
    }
  } else if (message.includes('fetch') || message.includes('network') || message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
    errorType = 'NETWORK_ERROR'
  } else if (message.includes('validation') || message.includes('schema') || message.includes('missing required') || message.includes('schema-validation')) {
    errorType = 'VALIDATION_ERROR'
  }
  
  return {
    errorType,
    errorMessage: message
  }
}
