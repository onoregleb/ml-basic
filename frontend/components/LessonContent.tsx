'use client'

import React, { memo } from 'react'
import { BookOpen } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import LazySimulator from './LazySimulator'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  lesson_type: string
  order_index: number
  module_id: number
}

interface LessonContentProps {
  lesson: Lesson
}

// Мэпинг названий симуляторов для каждого урока
const getSimulatorTitle = (lessonId: number): string => {
  const titles: Record<number, string> = {
    1: 'Интерактивный симулятор типов задач',
    2: 'Симулятор работы с данными',
    3: 'Интерактивный симулятор',
    4: 'Симулятор логистической регрессии',
    5: 'Симулятор kNN классификации',
    6: 'Сравнение метрик качества',
    7: 'Симулятор переобучения',
    8: 'Симулятор K-means кластеризации',
    9: 'Практический проект'
  }
  
  return titles[lessonId] || 'Интерактивный симулятор'
}

const LessonContent = memo(({ lesson }: LessonContentProps) => {
  const hasSimulator = [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(lesson.id)

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Теоретическая часть */}
      <div className="card">
        <div className="flex items-center mb-4">
          <BookOpen className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Теория</h2>
        </div>
        <MarkdownRenderer content={lesson.content} />
      </div>

      {/* Интерактивные симуляторы */}
      {hasSimulator && (
        <LazySimulator 
          lessonId={lesson.id} 
          title={getSimulatorTitle(lesson.id)}
        />
      )}
    </div>
  )
})

LessonContent.displayName = 'LessonContent'

export default LessonContent
