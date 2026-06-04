import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import admin from 'firebase-admin'
import { signToken } from '../../../../../utils/auth'

// Initialize Firebase Admin once
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'roast-my-project',
    })
  } catch (err: any) {
    console.error('Firebase Admin initialization error:', err.message)
  }
}

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Firebase ID Token is required' }, { status: 400 })
    }

    let decodedToken
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken)
    } catch (err: any) {
      console.error('Firebase token verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid or expired Firebase token: ' + err.message }, { status: 401 })
    }

    const { email, name, picture } = decodedToken
    if (!email) {
      return NextResponse.json({ error: 'Firebase token does not contain email' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email }
      }
    })

    let user

    if (users.docs.length > 0) {
      // User exists - update last login
      user = users.docs[0]
      user = await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          lastLogin: now,
          name: name || user.name, // update name if passed
        }
      })
    } else {
      // User does not exist - create user
      user = await payload.create({
        collection: 'users',
        data: {
          name: name || email.split('@')[0],
          email,
          authType: 'google',
          lastLogin: now,
        }
      })
    }

    // Generate custom JWT token
    const token = signToken({
      id: user.id.toString(),
      authType: 'google',
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        authType: user.authType,
      }
    })

  } catch (err: any) {
    console.error('Error in firebase-login API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
