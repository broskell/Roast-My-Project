import type { CollectionConfig } from 'payload'

export const Prompts: CollectionConfig = {
  slug: 'prompts',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'description', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'key',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'Funny Roast', value: 'Funny Roast' },
        { label: 'Brutal Roast', value: 'Brutal Roast' },
        { label: 'Recruiter Review', value: 'Recruiter Review' },
        { label: 'Senior Developer Review', value: 'Senior Developer Review' },
        { label: 'Investor Review', value: 'Investor Review' },
        { label: 'Resume Review', value: 'Resume Review' },
        { label: 'Idea Research', value: 'Idea Research' },
      ],
    },
    {
      name: 'promptText',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
}
