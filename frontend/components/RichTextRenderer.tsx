'use client'

import { memo } from 'react'

interface RichTextRendererProps {
  html: string
}

const RichTextRenderer = memo(({ html }: RichTextRendererProps) => {
  return (
    <div
      className={[
        'prose prose-gray max-w-none',
        // Improve code blocks readability
        'prose-pre:bg-gray-900 prose-pre:text-gray-100',
        'prose-pre:rounded-lg prose-pre:px-4 prose-pre:py-3',
        'prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        // Remove default backticks around inline code from typography
        'prose-code:before:content-none prose-code:after:content-none',
        // Better spacing for headings
        'prose-headings:scroll-mt-24',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  )
})

RichTextRenderer.displayName = 'RichTextRenderer'

export default RichTextRenderer

