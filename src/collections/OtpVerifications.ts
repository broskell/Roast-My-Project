import type { CollectionConfig } from 'payload'

export const OtpVerifications: CollectionConfig = {
  slug: 'otp_verifications',
  admin: {
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'otp', 'expiresAt', 'verified'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'otp',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true, // This index will be converted to a TTL index programmatically onInit
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
