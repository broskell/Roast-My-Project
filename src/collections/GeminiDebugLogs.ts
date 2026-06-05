import type { CollectionConfig } from 'payload'

export const GeminiDebugLogs: CollectionConfig = {
  slug: 'gemini_debug_logs',
  admin: {
    useAsTitle: 'requestId',
    defaultColumns: ['requestId', 'projectId', 'reviewMode', 'modelUsed', 'parseSuccess', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'requestId',
      type: 'text',
      required: true,
    },
    {
      name: 'projectId',
      type: 'text',
      required: true,
    },
    {
      name: 'reviewMode',
      type: 'text',
      required: true,
    },
    {
      name: 'rawResponse',
      type: 'textarea',
    },
    {
      name: 'parseSuccess',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'parseError',
      type: 'textarea',
    },
    {
      name: 'modelUsed',
      type: 'text',
    },
    {
      name: 'errorType',
      type: 'text',
    },
    {
      name: 'errorMessage',
      type: 'textarea',
    },
    {
      name: 'promptLength',
      type: 'number',
    },
    {
      name: 'imageBytes',
      type: 'number',
    },
  ],
}
