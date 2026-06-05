const REQUIRED_ENVS = [
  'PAYLOAD_SECRET',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
]

let envsValidated = false

export function validateEnv() {
  if (envsValidated) return

  const dbUri = process.env.MONGODB_URI || process.env.DATABASE_URI
  if (!dbUri) {
    throw new Error('[ENV-VALIDATOR] Missing required database connection string. Set MONGODB_URI or DATABASE_URI.')
  }

  const missing: string[] = []
  for (const envName of REQUIRED_ENVS) {
    if (!process.env[envName]) {
      missing.push(envName)
    }
  }

  if (missing.length > 0) {
    throw new Error(`[ENV-VALIDATOR] Missing required environment variables: ${missing.join(', ')}`)
  }

  envsValidated = true
  console.log('[ENV-VALIDATOR] Environment variables validated successfully.')
}
