/* eslint-disable */
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '../../../../../payload.config'
import { importMap } from '../importMap'

export const generateMetadata = ({ params, searchParams }: any) =>
  generatePageMetadata({ config, params, searchParams })

const NotFound = ({ params, searchParams }: any) => NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
