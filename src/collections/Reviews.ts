import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'score',
    defaultColumns: ['project', 'mode', 'score', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'roast',
      type: 'textarea',
      required: true,
    },
    {
      name: 'review',
      type: 'textarea',
      required: true,
    },
    {
      name: 'strengths',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'strength',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'weaknesses',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'weakness',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'suggestions',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'suggestion',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'score',
      type: 'number',
      required: true,
      min: 1,
      max: 10,
    },
    {
      name: 'mode',
      type: 'select',
      required: true,
      options: [
        { label: 'Funny Roast', value: 'Funny Roast' },
        { label: 'Brutal Roast', value: 'Brutal Roast' },
        { label: 'Recruiter Review', value: 'Recruiter Review' },
        { label: 'Senior Developer Review', value: 'Senior Developer Review' },
        { label: 'Investor Review', value: 'Investor Review' },
      ],
    },
    {
      name: 'provider',
      type: 'text',
    },
    {
      name: 'modelUsed',
      type: 'text',
    },
    {
      name: 'requestId',
      type: 'text',
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
    },
  ],
}
