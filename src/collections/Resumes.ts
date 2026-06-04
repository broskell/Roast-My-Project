import type { CollectionConfig } from 'payload'

export const Resumes: CollectionConfig = {
  slug: 'resumes',
  admin: {
    useAsTitle: 'score',
    defaultColumns: ['user', 'score', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'resumeUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'resumePublicId',
      type: 'text',
    },
    {
      name: 'score',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
    },
    {
      name: 'roast',
      type: 'textarea',
      required: true,
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
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
  ],
}
