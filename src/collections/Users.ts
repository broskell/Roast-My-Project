import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'email', 'authType', 'lastLogin'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      index: true,
      admin: {
        description: 'For users registered via Twilio OTP',
      },
    },
    {
      name: 'email',
      type: 'text',
      index: true,
      admin: {
        description: 'For users registered via Firebase Google Sign-In',
      },
    },
    {
      name: 'authType',
      type: 'select',
      required: true,
      options: [
        { label: 'Google Sign-In', value: 'google' },
        { label: 'Twilio OTP Login', value: 'twilio' },
      ],
    },
    {
      name: 'lastLogin',
      type: 'date',
    },
  ],
}
