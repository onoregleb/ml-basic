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
        // Keep typography backticks disabled; inline-code styling is applied in CSS
        // in a way that does NOT affect pre > code.
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

