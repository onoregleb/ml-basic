'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  User, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Trophy,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Activity,
  Mail,
  MapPin
} from 'lucide-react'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  lesson_type: string
  order_index: number
  module_id: number
  is_active: boolean
}

interface UserProgress {
  id: number
  user_id: number
  lesson_id: number
  status: string
  score: number
  completed_at: string | null
}

interface UserData {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Проверяем авторизацию при монтировании
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser))
      } catch (err) {
        console.error('Error parsing user data from localStorage:', err)
      }
    }
    
    // Загружаем данные только если пользователь авторизован
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Загружаем уроки (публичный эндпоинт, не требует токена)
      const lessonsResponse = await fetch('http://localhost:8000/api/lessons/')
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json()
        setLessons(lessonsData)
      } else {
        console.error('Failed to load lessons:', lessonsResponse.status)
        setError('Ошибка загрузки уроков')
      }

      // Загружаем прогресс пользователя (только если есть токен)
      if (token) {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        const progressResponse = await fetch('http://localhost:8000/api/lessons/user/progress', { headers })
        console.log('Progress response status:', progressResponse.status)
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json()
          setProgress(progressData)
        } else if (progressResponse.status === 401) {
          // Токен недействителен, очищаем его и перенаправляем на логин
          console.error('Token expired or invalid')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        } else {
          console.error('Failed to load progress:', progressResponse.status, await progressResponse.text())
        }
      } else {
        // Если нет токена, оставляем прогресс пустым
        setProgress([])
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const getProgressStats = () => {
    const completed = progress.filter(p => p.status === 'completed').length
    const inProgress = progress.filter(p => p.status === 'in_progress').length
    const totalScore = progress.reduce((sum, p) => sum + p.score, 0)
    const avgScore = progress.length > 0 ? totalScore / progress.length : 0

    return { completed, inProgress, totalScore, avgScore, total: lessons.length }
  }

  const getDetailedProfileStats = () => {
    const completedLessons = progress.filter(p => p.status === 'completed')
    const inProgressLessons = progress.filter(p => p.status === 'in_progress')
    
    // Статистика по модулям
    const moduleStats: { [key: number]: { completed: number; total: number; avgScore: number } } = {}
    
    lessons.forEach(lesson => {
      const moduleId = lesson.module_id
      if (!moduleStats[moduleId]) {
        moduleStats[moduleId] = { completed: 0, total: 0, avgScore: 0 }
      }
      moduleStats[moduleId].total++
      
      const lessonProgress = progress.find(p => p.lesson_id === lesson.id)
      if (lessonProgress?.status === 'completed') {
        moduleStats[moduleId].completed++
        moduleStats[moduleId].avgScore += lessonProgress.score
      }
    })

    // Вычисляем средние баллы по модулям
    Object.keys(moduleStats).forEach(moduleId => {
      const stats = moduleStats[+moduleId]
      stats.avgScore = stats.completed > 0 ? stats.avgScore / stats.completed : 0
    })

    // Общая статистика времени
    const joinDate = userData?.created_at ? new Date(userData.created_at) : new Date()
    const daysSinceJoin = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      completedLessons,
      inProgressLessons,
      moduleStats,
      daysSinceJoin,
      completionRate: lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0
    }
  }

  const getLessonProgress = (lessonId: number) => {
    return progress.find(p => p.lesson_id === lessonId)
  }

  const stats = getProgressStats()
  const profileStats = getDetailedProfileStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Боковая панель */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">ML Курс</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'dashboard' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'profile' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Профиль
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Выйти
            </button>
          </div>
        </nav>
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Шапка */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 ml-2 lg:ml-0">
                  Добро пожаловать, {userData?.full_name || userData?.email}!
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Контент */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {activeTab === 'dashboard' ? (
              <>
                {/* Dashboard - Статистика */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Завершено уроков</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">В процессе</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <BookOpen className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Всего уроков</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Средний балл</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avgScore.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard - Список уроков */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Уроки</h2>
                  </div>
                  <div className="p-6">
                    {lessons.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Уроки не найдены</p>
                    ) : (
                      <div className="space-y-4">
                        {lessons.map((lesson) => {
                          const lessonProgress = getLessonProgress(lesson.id)
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/lesson/${lesson.id}`)}
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                                <p className="text-sm text-gray-600">{lesson.description}</p>
                                <div className="mt-2 flex items-center space-x-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {lesson.lesson_type}
                                  </span>
                                  {lessonProgress && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      lessonProgress.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : lessonProgress.status === 'in_progress'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {lessonProgress.status === 'completed' ? 'Завершён' :
                                       lessonProgress.status === 'in_progress' ? 'В процессе' : 'Не начат'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {lessonProgress?.status === 'completed' && (
                                  <CheckCircle className="h-6 w-6 text-green-500 mr-4" />
                                )}
                                {lessonProgress && (
                                  <div className="text-right mr-4">
                                    <p className="text-sm font-medium text-gray-900">
                                      {lessonProgress.score.toFixed(1)} баллов
                                    </p>
                                  </div>
                                )}
                                <div className="text-gray-400">→</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Profile Tab */}
                <div className="space-y-6">
                  {/* Профиль пользователя */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Мой профиль</h2>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-6 mb-6">
                        <div className="bg-blue-100 rounded-full p-4">
                          <User className="h-12 w-12 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{userData?.full_name || 'Пользователь'}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{userData?.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>На платформе {profileStats.daysSinceJoin} дней</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Общая статистика прогресса */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Процент завершения</p>
                          <p className="text-2xl font-bold text-gray-900">{profileStats.completionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <Award className="h-8 w-8 text-yellow-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Общий балл</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalScore}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Активность</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {progress.length > 0 ? Math.ceil(progress.length / Math.max(1, profileStats.daysSinceJoin)) : 0}
                          </p>
                          <p className="text-xs text-gray-500">уроков/день</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Прогресс по модулям */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Прогресс по модулям</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {Object.entries(profileStats.moduleStats).map(([moduleId, stats]) => {
                          const progressPercentage = (stats.completed / stats.total) * 100
                          return (
                            <div key={moduleId} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">Модуль {moduleId}</h4>
                                <span className="text-sm text-gray-600">
                                  {stats.completed}/{stats.total} уроков
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{progressPercentage.toFixed(1)}% завершено</span>
                                <span className="text-gray-600">
                                  Средний балл: {stats.avgScore.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Последние достижения */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Последние завершённые уроки</h3>
                    </div>
                    <div className="p-6">
                      {profileStats.completedLessons.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Пока нет завершённых уроков</p>
                      ) : (
                        <div className="space-y-3">
                          {profileStats.completedLessons
                            .sort((a, b) => new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime())
                            .slice(0, 5)
                            .map((progressItem) => {
                              const lesson = lessons.find(l => l.id === progressItem.lesson_id)
                              if (!lesson) return null
                              
                              return (
                                <div key={progressItem.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div>
                                      <p className="font-medium text-gray-900">{lesson.title}</p>
                                      <p className="text-sm text-gray-600">
                                        {progressItem.completed_at ? 
                                          new Date(progressItem.completed_at).toLocaleDateString('ru-RU') : 
                                          'Дата неизвестна'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {progressItem.score} баллов
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}