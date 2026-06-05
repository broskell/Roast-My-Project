import type { CollectionConfig } from 'payload'

export const IdeaReports: CollectionConfig = {
  slug: 'idea_reports',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'industry', 'createdBy', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'targetAudience',
      type: 'text',
      required: true,
    },
    {
      name: 'industry',
      type: 'text',
      required: true,
    },
    {
      name: 'countryRegion',
      type: 'text',
    },
    {
      name: 'report',
      type: 'json',
      required: true,
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
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
  ],
}
