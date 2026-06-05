import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import twilio from 'twilio'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    let isMockMode = !twilioSid || 
                      twilioSid.startsWith('AC_mock') || 
                      !twilioAuthToken || 
                      !verifyServiceSid || 
                      verifyServiceSid.startsWith('VA_mock')
    let twilioError = ''

    if (!isMockMode) {
      try {
        const client = twilio(twilioSid, twilioAuthToken)
        await client.verify.v2.services(verifyServiceSid!).verifications.create({
          to: phone,
          channel: 'sms',
        })
      } catch (err: any) {
        console.error('Twilio Verify sending failed, falling back to mock mode:', err.message)
        isMockMode = true
        twilioError = err.message
      }
    }

    if (isMockMode) {
      // 1. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiration

      // 2. Save to database using Payload local API
      const payload = await getPayload({ config })
      
      // Check if there's any existing unexpired/expired OTP for this number and delete it to prevent bloat
      await payload.delete({
        collection: 'otp_verifications',
        where: {
          phone: { equals: phone }
        }
      })

      // Save the new OTP
      await payload.create({
        collection: 'otp_verifications',
        data: {
          phone,
          otp,
          expiresAt,
          verified: false,
        }
      })

      console.log('\n=============================================')
      console.log(`[MOCK MODE OTP] SMS verification code sent to ${phone}`)
      console.log(`CODE: ${otp}`)
      console.log('=============================================\n')
      
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully (Mock Mode)',
        otp: otp, // Return OTP in response for development convenience
        mockMode: true,
        twilioError: twilioError || undefined
      })
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully via Twilio Verify',
      mockMode: false
    })

  } catch (err: any) {
    console.error('Error in send-otp API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
