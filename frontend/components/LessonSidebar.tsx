'use client'

import React, { memo, useMemo } from 'react'
import { Clock } from 'lucide-react'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  content_html?: string
  lesson_type: string
  order_index: number
  module_id: number
  toc?: Array<{ level: number; text: string; id: string }>
}

interface UserProgress {
  id: number
  user_id: number
  lesson_id: number
  status: string
  score: number
  completed_at: string | null
}

interface LessonSidebarProps {
  lesson: Lesson
  progress: UserProgress | null
  allLessons: Lesson[]
  onNavigateToLesson: (lessonId: number) => void
}

// Компонент информации об уроке
const LessonInfo = memo(({ lesson }: { lesson: Lesson }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация</h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Тип:</span>
        <span className="font-medium">
          {lesson.lesson_type === 'theory' ? 'Теория' : 
           lesson.lesson_type === 'practice' ? 'Практика' : 'Тест'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Порядок:</span>
        <span className="font-medium">{lesson.order_index}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Модуль:</span>
        <span className="font-medium">{lesson.module_id}</span>
      </div>
    </div>
  </div>
))
LessonInfo.displayName = 'LessonInfo'

// Компонент прогресса
const ProgressInfo = memo(({ progress }: { progress: UserProgress | null }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ваш прогресс</h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Статус:</span>
        <span className={`font-medium ${
          progress?.status === 'completed' ? 'text-green-600' :
          progress?.status === 'in_progress' ? 'text-yellow-600' :
          'text-gray-600'
        }`}>
          {progress?.status === 'completed' ? 'Завершено' :
           progress?.status === 'in_progress' ? 'В процессе' :
           'Не начато'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Оценка:</span>
        <span className="font-medium">{progress?.score || 0}/100</span>
      </div>
      {progress?.completed_at && (
        <div className="flex justify-between">
          <span className="text-gray-600">Завершен:</span>
          <span className="font-medium text-sm">
            {new Date(progress.completed_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
      )}
    </div>
  </div>
))
ProgressInfo.displayName = 'ProgressInfo'

// Компонент навигации
const LessonNavigation = memo(({ 
  lesson, 
  allLessons, 
  onNavigateToLesson 
}: { 
  lesson: Lesson
  allLessons: Lesson[]
  onNavigateToLesson: (lessonId: number) => void
}) => {
  const { previousLesson, nextLesson } = useMemo(() => {
    const sortedLessons = [...allLessons].sort((a, b) => a.order_index - b.order_index)
    const currentIndex = sortedLessons.findIndex(l => l.id === lesson.id)
    
    return {
      previousLesson: currentIndex > 0 ? sortedLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null
    }
  }, [allLessons, lesson.id])

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Навигация</h3>
      <div className="space-y-2">
        {previousLesson ? (
          <button 
            onClick={() => onNavigateToLesson(previousLesson.id)}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-blue-600 hover:text-blue-800"
          >
            ← {previousLesson.title}
          </button>
        ) : (
          <div className="w-full text-left p-2 text-gray-400">
            ← Это первый урок
          </div>
        )}
        
        {nextLesson ? (
          <button 
            onClick={() => onNavigateToLesson(nextLesson.id)}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-blue-600 hover:text-blue-800"
          >
            {nextLesson.title} →
          </button>
        ) : (
          <div className="w-full text-left p-2 text-gray-400">
            Это последний урок →
          </div>
        )}
      </div>
    </div>
  )
})
LessonNavigation.displayName = 'LessonNavigation'

// Компонент содержания урока (из backend toc)
const TableOfContents = memo(({ toc }: { toc?: Array<{ level: number; text: string; id: string }> }) => {
  const tableOfContents = useMemo(() => toc || [], [toc])

  if (!tableOfContents.length) return null

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Содержание урока</h3>
      <div className="space-y-1">
        {tableOfContents.map((item, index) => (
          <div
            key={index}
            className={`text-sm hover:text-blue-600 cursor-pointer transition-colors ${
              item.level === 1 ? 'font-semibold text-gray-900' :
              item.level === 2 ? 'font-medium text-gray-700 ml-3' :
              'text-gray-600 ml-6'
            }`}
            onClick={() => {
              const element = document.getElementById(item.id)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          >
            {item.text.replace(/[🚀🎯📊🔍🎨⚖️🛠️🚨💡🎓]/g, '').trim()}
          </div>
        ))}
      </div>
    </div>
  )
})
TableOfContents.displayName = 'TableOfContents'

// Компонент связанных уроков модуля
const RelatedLessons = memo(({ 
  lesson, 
  allLessons, 
  onNavigateToLesson 
}: { 
  lesson: Lesson
  allLessons: Lesson[]
  onNavigateToLesson: (lessonId: number) => void
}) => {
  const moduleLessons = useMemo(() => 
    allLessons
      .filter(l => l.module_id === lesson.module_id)
      .sort((a, b) => a.order_index - b.order_index),
    [allLessons, lesson.module_id]
  )

  if (moduleLessons.length <= 1) return null

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Модуль {lesson.module_id}</h3>
      <div className="space-y-2">
        {moduleLessons.map(relatedLesson => (
          <div
            key={relatedLesson.id}
            className={`text-sm p-2 rounded cursor-pointer transition-colors ${
              relatedLesson.id === lesson.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
            }`}
            onClick={() => {
              if (relatedLesson.id !== lesson.id) {
                onNavigateToLesson(relatedLesson.id)
              }
            }}
          >
            {relatedLesson.order_index}. {relatedLesson.title}
            {relatedLesson.id === lesson.id && ' (текущий)'}
          </div>
        ))}
      </div>
    </div>
  )
})
RelatedLessons.displayName = 'RelatedLessons'

// Компонент времени изучения и информации
const LessonMeta = memo(({ lesson }: { lesson: Lesson }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Информация об уроке</h3>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Время изучения:</span>
        <span className="font-medium">
          {lesson?.lesson_type === 'practice' ? '20-30 мин' : '15-20 мин'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Сложность:</span>
        <span className="font-medium">
          {lesson?.order_index && lesson.order_index <= 3 ? 'Начальная' :
           lesson?.order_index && lesson.order_index <= 6 ? 'Средняя' : 'Продвинутая'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Интерактивность:</span>
        <span className="font-medium">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].includes(lesson?.id || 0) ? '✅ Есть симулятор' : '📖 Теория'}
        </span>
      </div>
    </div>
  </div>
))
LessonMeta.displayName = 'LessonMeta'

// Компонент полезных ресурсов
const UsefulResources = memo(({ lesson }: { lesson: Lesson }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Полезные ресурсы</h3>
    <div className="space-y-2 text-sm">
      {lesson?.id === 1 && (
        <>
          <a href="https://ru.coursera.org/learn/machine-learning" target="_blank" rel="noopener noreferrer" 
             className="block text-blue-600 hover:text-blue-800 hover:underline">
            📖 Курс ML на Coursera
          </a>
          <a href="https://www.youtube.com/watch?v=aircAruvnKk" target="_blank" rel="noopener noreferrer"
             className="block text-blue-600 hover:text-blue-800 hover:underline">
            🎥 Что такое нейронные сети?
          </a>
        </>
      )}
      {lesson?.id === 2 && (
        <>
          <a href="https://pandas.pydata.org/docs/getting_started/intro_tutorials/" target="_blank" rel="noopener noreferrer"
             className="block text-blue-600 hover:text-blue-800 hover:underline">
            🐼 Pandas для работы с данными
          </a>
          <a href="https://seaborn.pydata.org/tutorial.html" target="_blank" rel="noopener noreferrer"
             className="block text-blue-600 hover:text-blue-800 hover:underline">
            📊 Визуализация с Seaborn
          </a>
        </>
      )}
      {lesson?.id === 3 && (
        <>
          <a href="https://scikit-learn.org/stable/modules/linear_model.html" target="_blank" rel="noopener noreferrer"
             className="block text-blue-600 hover:text-blue-800 hover:underline">
            🔬 Sklearn: Линейная регрессия
          </a>
          <a href="https://www.khanacademy.org/math/statistics-probability/describing-relationships-quantitative-data/introduction-to-trend-lines/a/linear-regression-review" target="_blank" rel="noopener noreferrer"
             className="block text-blue-600 hover:text-blue-800 hover:underline">
            📚 Khan Academy: Линейная регрессия
          </a>
        </>
      )}
      <a href="https://github.com" target="_blank" rel="noopener noreferrer"
         className="block text-blue-600 hover:text-blue-800 hover:underline">
        💾 GitHub репозитории по ML
      </a>
      <a href="https://stackoverflow.com/questions/tagged/machine-learning" target="_blank" rel="noopener noreferrer"
         className="block text-blue-600 hover:text-blue-800 hover:underline">
        ❓ Q&A на StackOverflow
      </a>
    </div>
  </div>
))
UsefulResources.displayName = 'UsefulResources'

// Основной компонент сайдбара
const LessonSidebar = memo(({ lesson, progress, allLessons, onNavigateToLesson }: LessonSidebarProps) => {
  return (
    <div className="space-y-6">
      <LessonInfo lesson={lesson} />
      <ProgressInfo progress={progress} />
      <LessonNavigation 
        lesson={lesson} 
        allLessons={allLessons} 
        onNavigateToLesson={onNavigateToLesson} 
      />
      <TableOfContents toc={lesson.toc} />
      <RelatedLessons 
        lesson={lesson} 
        allLessons={allLessons} 
        onNavigateToLesson={onNavigateToLesson} 
      />
      <LessonMeta lesson={lesson} />
      <UsefulResources lesson={lesson} />
    </div>
  )
})

LessonSidebar.displayName = 'LessonSidebar'

export default LessonSidebar
