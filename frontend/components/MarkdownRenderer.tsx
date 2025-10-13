'use client'

import { memo, useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
}

// Мемоизированная функция для конвертации базового markdown в HTML
const formatMarkdown = (text: string): string => {
  if (!text) return ''
  
  // Разбиваем текст на строки для поблочной обработки
  const lines = text.split('\n')
  const result: string[] = []
  let inCodeBlock = false
  let inPythonBlock = false
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Обработка блоков кода
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push('</code></pre>')
        if (inPythonBlock) {
          result.push('</div>')
          inPythonBlock = false
        }
        inCodeBlock = false
      } else {
        // Определяем язык программирования
        const language = line.slice(3).trim()
        let className = 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono'
        
        if (language === 'python') {
          inPythonBlock = true
          result.push(`<div class="relative mb-4">
            <div class="bg-gray-800 px-3 py-1 rounded-t-lg text-xs text-gray-300 flex items-center">
              🐍 <strong class="ml-1">Код на Python</strong>
            </div>
            <pre class="${className}"><code class="language-python">`)
        } else {
          result.push(`<pre class="${className}"><code>`)
        }
        inCodeBlock = true
      }
      continue
    }
    
    if (inCodeBlock) {
      // Экранируем HTML символы в коде
      const escapedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
      result.push(escapedLine)
      continue
    }
    
    // Заголовки - проверяем и обрабатываем с учетом пробелов
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false }
      const headerText = trimmedLine.slice(4).trim()
      const headerId = headerText.replace(/[^\w\s\u0400-\u04FF]/g, '').trim().toLowerCase().replace(/\s+/g, '-')
      result.push(`<h3 id="${headerId}" class="text-lg font-semibold text-gray-900 mt-6 mb-3">${headerText}</h3>`)
      continue
    }
    
    if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false }
      const headerText = trimmedLine.slice(3).trim()
      const headerId = headerText.replace(/[^\w\s\u0400-\u04FF]/g, '').trim().toLowerCase().replace(/\s+/g, '-')
      result.push(`<h2 id="${headerId}" class="text-xl font-semibold text-gray-900 mt-8 mb-4">${headerText}</h2>`)
      continue
    }
    
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false }
      const headerText = trimmedLine.slice(2).trim()
      const headerId = headerText.replace(/[^\w\s\u0400-\u04FF]/g, '').trim().toLowerCase().replace(/\s+/g, '-')
      result.push(`<h1 id="${headerId}" class="text-2xl font-bold text-gray-900 mt-8 mb-6">${headerText}</h1>`)
      continue
    }
    
    // Списки
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (!inList) {
        result.push('<ul class="list-disc list-inside space-y-2 ml-4 mb-4">')
        inList = true
      }
      let listItem = trimmedLine.slice(2).trim()
      // Обработка форматирования внутри списка
      listItem = listItem
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      result.push(`<li class="text-gray-700">${listItem}</li>`)
      continue
    } else if (inList && trimmedLine !== '') {
      result.push('</ul>')
      inList = false
    }
    
    // Пустые строки
    if (line.trim() === '') {
      continue
    }
    
    // Обычные абзацы
    let paragraph = line
    // Обработка форматирования
    paragraph = paragraph
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    
    result.push(`<p class="text-gray-700 mb-4 leading-relaxed">${paragraph}</p>`)
  }
  
  // Закрываем открытые теги
  if (inList) result.push('</ul>')
  if (inCodeBlock) {
    result.push('</code></pre>')
    if (inPythonBlock) {
      result.push('</div>')
    }
  }
  
  return result.join('\n')
}

const MarkdownRenderer = memo(({ content }: MarkdownRendererProps) => {
  const formattedContent = useMemo(() => formatMarkdown(content), [content])
  
  return (
    <div
      className="prose prose-gray max-w-none"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  )
})

MarkdownRenderer.displayName = 'MarkdownRenderer'

export default MarkdownRenderer
