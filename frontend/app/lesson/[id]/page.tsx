'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

// Оптимизированные компоненты
import LessonHeader from '@/components/LessonHeader'
import LessonContent from '@/components/LessonContent'
import LessonSidebar from '@/components/LessonSidebar'
import ModuleCompleteModal from '@/components/ModuleCompleteModal'

// Оптимизированные API хуки
import { 
  useLessonData, 
  useProgressData, 
  useAllLessons, 
  useUpdateProgress,
  prefetchData 
} from '@/hooks/useOptimizedApi'

// Хуки для мониторинга производительности
import { 
  usePerformanceMonitor,
  useDeviceOptimization
} from '@/hooks/usePerformanceMonitor'

// Компонент для отображения производительности
import { PerformanceIndicator } from '@/components/PerformanceIndicator'

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

// Мемоизированные компоненты состояний загрузки и ошибок
const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

const ErrorState = ({ error, onRetry, onGoBack }: { 
  error: string
  onRetry: () => void
  onGoBack: () => void 
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="card text-center max-w-md">
      <h2 className="text-xl font-semibold text-red-600 mb-2">
        Ошибка
      </h2>
      <p className="text-gray-600 mb-4">
        {error}
      </p>
      <div className="flex gap-4">
        <button onClick={onGoBack} className="btn-secondary">
          Назад
        </button>
        <button onClick={onRetry} className="btn-primary">
          Попробовать снова
        </button>
      </div>
    </div>
  </div>
)

const NotFoundState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="card text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Урок не найден
      </h2>
      <p className="text-gray-600">
        Запрашиваемый урок не существует или был удален
      </p>
    </div>
  </div>
)

const NotAuthorizedState = () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card text-center max-w-md">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Требуется авторизация
          </h2>
          <p className="text-gray-600 mb-4">
            Войдите в систему, чтобы получить доступ к урокам
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Назад
            </button>
            <a href="/login" className="btn-primary">
              Войти
            </a>
          </div>
        </div>
      </div>
    )

export default function OptimizedLessonPage() {
  const params = useParams()
  
  // Мониторинг производительности и оптимизации устройства
  const performanceMetrics = usePerformanceMonitor('LessonPage')
  const deviceOptimizations = useDeviceOptimization()
  
  // Мемоизация параметров
  const lessonId = useMemo(() => {
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      return 0
    }
    const id = parseInt(params.id, 10)
    if (isNaN(id) || id <= 0 || !Number.isInteger(Number(params.id)) || id > 1000 || params.id.length > 10) {
      return 0
    }
    return id
  }, [params.id])

  // Состояние авторизации
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showModuleCompleteModal, setShowModuleCompleteModal] = useState(false)

  // Отслеживание рендеров для разработки
  const renderCountRef = useRef(0)
  renderCountRef.current += 1
  console.log('OptimizedLessonPage render count:', renderCountRef.current, performanceMetrics)

  // Оптимизированные API вызовы
  const { data: lesson, loading: lessonLoading, error: lessonError, refetch: refetchLesson } = useLessonData(lessonId > 0 ? lessonId : null)
  const { data: progress, loading: progressLoading, refetch: refetchProgress } = useProgressData(lessonId > 0 ? lessonId : null)
  const { data: allLessons, loading: allLessonsLoading } = useAllLessons()
  const { updateProgress, loading: updateProgressLoading } = useUpdateProgress()

  // Типизированные данные
  const typedLesson = lesson as Lesson | null
  const typedProgress = progress as UserProgress | null
  const typedAllLessons = (allLessons as Lesson[]) || []

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  // Предварительная загрузка связанных данных
  useEffect(() => {
    if (isLoggedIn && typedLesson && typedAllLessons) {
      const relatedLessonIds = typedAllLessons
        .filter(l => l.module_id === typedLesson.module_id && l.id !== typedLesson.id)
        .slice(0, 3) // Предзагружаем только 3 ближайших урока
        .map(l => `http://localhost:8000/api/lessons/${l.id}`)
      
      if (relatedLessonIds.length > 0) {
        prefetchData(relatedLessonIds, { cacheTTL: 10 * 60 * 1000 })
      }
    }
  }, [isLoggedIn, typedLesson, typedAllLessons])

  // Автоматическое обновление прогресса при первом открытии урока
  useEffect(() => {
    if (typedLesson && !typedProgress && !progressLoading && isLoggedIn) {
      updateProgress(typedLesson.id, 'in_progress', 0).catch(() => {
        // Игнорируем ошибки автообновления прогресса
      })
    }
  }, [typedLesson, typedProgress, progressLoading, isLoggedIn, updateProgress])

  // Проверка, является ли урок последним в модуле
  const isLastLessonInModule = useMemo(() => {
    if (!typedLesson || !typedAllLessons?.length) return false
    
    const moduleLessons = typedAllLessons
      .filter(l => l.module_id === typedLesson.module_id)
      .sort((a, b) => a.order_index - b.order_index)
    
    const lastLessonInModule = moduleLessons[moduleLessons.length - 1]
    return typedLesson.id === lastLessonInModule?.id
  }, [typedLesson, typedAllLessons])

  // Обработчики событий
  const handleMarkCompleted = useCallback(async () => {
    if (!typedLesson) return
    
    try {
      await updateProgress(typedLesson.id, 'completed', 100)
      refetchProgress()
      toast.success('Прогресс обновлен!')
      
      // Показываем модальное окно для последнего урока модуля
      if (isLastLessonInModule) {
        setTimeout(() => {
          setShowModuleCompleteModal(true)
        }, 1500)
      }
    } catch (error) {
      toast.error('Не удалось обновить прогресс')
    }
  }, [typedLesson, updateProgress, refetchProgress, isLastLessonInModule])

  const handleNavigateToLesson = useCallback((targetLessonId: number) => {
    window.location.href = `/lesson/${targetLessonId}`
  }, [])

  const handleModalClose = useCallback(() => {
    setShowModuleCompleteModal(false)
  }, [])

  const handleGoToDashboard = useCallback(() => {
                    setShowModuleCompleteModal(false)
                    window.location.href = '/dashboard'
  }, [])
                
  const handleGoToNextModule = useCallback(() => {
    setShowModuleCompleteModal(false)
    
    if (!typedLesson || !typedAllLessons) {
      window.location.href = '/dashboard'
      return
    }

    const nextModuleLesson = typedAllLessons
      .filter(l => l.module_id === typedLesson.module_id + 1)
      .sort((a, b) => a.order_index - b.order_index)[0]
    
    if (nextModuleLesson) {
      window.location.href = `/lesson/${nextModuleLesson.id}`
    } else {
      window.location.href = '/dashboard'
    }
  }, [typedLesson, typedAllLessons])

  const handleRetry = useCallback(() => {
    refetchLesson()
    refetchProgress()
  }, [refetchLesson, refetchProgress])

  const handleGoBack = useCallback(() => {
    window.history.back()
  }, [])

  // Состояния загрузки и ошибок
  if (!isLoggedIn) return <NotAuthorizedState />
  
  if (lessonId <= 0) {
    return <ErrorState error="Неверный ID урока" onRetry={handleRetry} onGoBack={handleGoBack} />
  }
  
  if (lessonError) {
    return <ErrorState error={lessonError} onRetry={handleRetry} onGoBack={handleGoBack} />
  }
  
  if (lessonLoading || allLessonsLoading) {
    return <LoadingState />
  }
  
  if (!typedLesson) {
    return <NotFoundState />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LessonHeader
        lesson={typedLesson}
        progress={typedProgress}
        onMarkCompleted={handleMarkCompleted}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <LessonContent lesson={typedLesson} />
          
          {typedAllLessons && (
            <LessonSidebar
              lesson={typedLesson}
              progress={typedProgress}
              allLessons={typedAllLessons}
              onNavigateToLesson={handleNavigateToLesson}
            />
          )}
        </div>
      </div>

      {typedAllLessons && (
        <ModuleCompleteModal
          isOpen={showModuleCompleteModal}
          lesson={typedLesson}
          allLessons={typedAllLessons}
          onClose={handleModalClose}
          onGoToDashboard={handleGoToDashboard}
          onGoToNextModule={handleGoToNextModule}
        />
      )}
      
      {/* Индикатор производительности (только в development) */}
      <PerformanceIndicator show={true} />
    </div>
  )
}
