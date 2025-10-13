'use client'

import React, { memo } from 'react'
import { CheckCircle } from 'lucide-react'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  lesson_type: string
  order_index: number
  module_id: number
}

interface UserProgress {
  id: number
  user_id: number
  lesson_id: number
  status: string
  score: number
  completed_at: string | null
}

interface LessonHeaderProps {
  lesson: Lesson
  progress: UserProgress | null
  onMarkCompleted: () => void
}

const LessonHeader = memo(({ lesson, progress, onMarkCompleted }: LessonHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a 
                href="/dashboard" 
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-4.586l.293.293a1 1 0 001.414-1.414l-9-9z"></path>
                </svg>
                Личный кабинет
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 md:ml-2 text-sm font-medium text-gray-700">
                  Модуль {lesson.module_id}
                </span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 md:ml-2 text-sm font-medium text-gray-500 truncate">
                  Урок {lesson.order_index}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-gray-600 mt-1">{lesson.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Прогресс</div>
              <div className="text-lg font-semibold text-gray-900">
                {progress?.status === 'completed' ? '100%' : 
                 progress?.status === 'in_progress' ? '50%' : '0%'}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Кнопка возврата к курсам */}
              <a
                href="/dashboard"
                className="btn-secondary flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 7 4-4 4 4m0 0v11m0-11L8 7" />
                </svg>
                К курсам
              </a>

              {progress?.status === 'completed' ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Завершено</span>
                </div>
              ) : (
                <button
                  onClick={onMarkCompleted}
                  className="btn-primary"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Завершить урок
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

LessonHeader.displayName = 'LessonHeader'

export default LessonHeader
