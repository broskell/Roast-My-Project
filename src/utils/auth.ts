import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import config from '../../payload.config'

const JWT_SECRET = process.env.JWT_SECRET || 'roast_my_project_jwt_secret_99887766554433221100'

export interface JWTPayload {
  id: string
  authType: string
}

export function signToken(data: JWTPayload): string {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (err) {
    throw new Error('Invalid or expired authentication token')
  }
}

export async function getAuthenticatedUser(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    // Get payload instance to query the database
    const payload = await getPayload({ config })
    const user = await payload.findByID({
      collection: 'users',
      id: decoded.id,
    })
    
    return user || null
  } catch (err) {
    return null
  }
}
