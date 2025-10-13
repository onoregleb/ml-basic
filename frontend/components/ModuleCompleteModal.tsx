'use client'

import React, { memo } from 'react'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  lesson_type: string
  order_index: number
  module_id: number
}

interface ModuleCompleteModalProps {
  isOpen: boolean
  lesson: Lesson
  allLessons: Lesson[]
  onClose: () => void
  onGoToDashboard: () => void
  onGoToNextModule: () => void
}

const ModuleCompleteModal = memo(({
  isOpen,
  lesson,
  allLessons,
  onClose,
  onGoToDashboard,
  onGoToNextModule
}: ModuleCompleteModalProps) => {
  if (!isOpen) return null

  const hasNextModule = allLessons.some(l => l.module_id === (lesson?.module_id || 0) + 1)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                🎉 Поздравляем!
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Вы успешно завершили <strong>Модуль {lesson?.module_id}</strong>! 
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Отличная работа! Теперь вы можете перейти к изучению других модулей или повторить пройденный материал.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
              onClick={onGoToDashboard}
            >
              🏠 К обзору курсов
            </button>
            
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={onGoToNextModule}
            >
              {hasNextModule ? '➡️ Следующий модуль' : '🏠 К курсам'}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
              onClick={onClose}
            >
              Продолжить изучение этого урока
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

ModuleCompleteModal.displayName = 'ModuleCompleteModal'

export default ModuleCompleteModal
