import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { signToken } from '../../../../../utils/auth'
import twilio from 'twilio'

export async function POST(req: Request) {
  try {
    const { phone, otp, name } = await req.json()
    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    const isMockMode = !twilioSid || 
                      twilioSid.startsWith('AC_mock') || 
                      !twilioAuthToken || 
                      !verifyServiceSid || 
                      verifyServiceSid.startsWith('VA_mock')

    if (!isMockMode) {
      try {
        const client = twilio(twilioSid, twilioAuthToken)
        const check = await client.verify.v2.services(verifyServiceSid!).verificationChecks.create({
          to: phone,
          code: otp,
        })
        if (check.status !== 'approved') {
          return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
        }
      } catch (err: any) {
        console.error('Twilio Verify check failed:', err.message)
        return NextResponse.json({ error: `Verification check failed: ${err.message}` }, { status: 400 })
      }
    } else {
      // Find verification code
      const verifications = await payload.find({
        collection: 'otp_verifications',
        where: {
          and: [
            { phone: { equals: phone } },
            { otp: { equals: otp } },
            { verified: { equals: false } },
          ]
        }
      })

      if (verifications.docs.length === 0) {
        return NextResponse.json({ error: 'Invalid or already used verification code' }, { status: 400 })
      }

      const verification = verifications.docs[0]

      // Verify expiration
      const expiresAt = new Date(verification.expiresAt).getTime()
      if (Date.now() > expiresAt) {
        return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
      }

      // Mark OTP as verified
      await payload.update({
        collection: 'otp_verifications',
        id: verification.id,
        data: {
          verified: true,
        }
      })
    }

    // Find or create user
    const users = await payload.find({
      collection: 'users',
      where: {
        phone: { equals: phone }
      }
    })

    let user
    const now = new Date().toISOString()

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
          name: name || `User ${phone.slice(-4)}`,
          phone,
          authType: 'twilio',
          lastLogin: now,
        }
      })
    }

    // Generate custom JWT token
    const token = signToken({
      id: user.id.toString(),
      authType: 'twilio',
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        authType: user.authType,
      }
    })

  } catch (err: any) {
    console.error('Error in verify-otp API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
