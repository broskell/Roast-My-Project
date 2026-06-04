import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'user', 'createdAt'],
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
      name: 'screenshotUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'screenshotPublicId',
      type: 'text',
    },
    {
      name: 'githubUrl',
      type: 'text',
    },
    {
      name: 'liveUrl',
      type: 'text',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Portfolio', value: 'Portfolio' },
        { label: 'SaaS', value: 'SaaS' },
        { label: 'E-Commerce', value: 'E-Commerce' },
        { label: 'Dashboard', value: 'Dashboard' },
        { label: 'Landing Page', value: 'Landing Page' },
        { label: 'Mobile App', value: 'Mobile App' },
        { label: 'Blog', value: 'Blog' },
        { label: 'Other', value: 'Other' },
      ],
      admin: {
        description: 'Automatically detected by Gemini AI',
      },
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
