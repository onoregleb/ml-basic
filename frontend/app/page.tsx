'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Brain, BarChart3, Play, ArrowRight, User, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleStartCourse = () => {
    if (!isLoggedIn) {
      toast.error('Сначала войдите в систему')
      return
    }
    // Перенаправление на курс
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">ML Course</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#about" className="text-gray-600 hover:text-primary-600 transition-colors">
                О курсе
              </Link>
              <Link href="#modules" className="text-gray-600 hover:text-primary-600 transition-colors">
                Модули
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                Возможности
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link href="/dashboard" className="btn-primary">
                  <User className="h-4 w-4 mr-2" />
                  Личный кабинет
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary">
                    <LogIn className="h-4 w-4 mr-2" />
                    Войти
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Изучайте машинное обучение
            <span className="text-primary-600 block">интерактивно</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Освойте основы ML через практические симуляторы, интерактивные задания 
            и реальные проекты. От теории до практики — всё в одном месте.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartCourse}
              className="btn-primary text-lg px-8 py-3 flex items-center justify-center"
            >
              <Play className="h-5 w-5 mr-2" />
              Начать курс
            </button>
            <Link href="#about" className="btn-secondary text-lg px-8 py-3 flex items-center justify-center">
              Узнать больше
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Почему наш курс особенный?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Мы объединили лучшие практики обучения с современными технологиями
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Интерактивные симуляторы
              </h3>
              <p className="text-gray-600">
                Экспериментируйте с алгоритмами в реальном времени. 
                Меняйте параметры и наблюдайте за результатами.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Структурированное обучение
              </h3>
              <p className="text-gray-600">
                От простого к сложному. Каждый модуль строится 
                на знаниях предыдущего.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Практические проекты
              </h3>
              <p className="text-gray-600">
                Применяйте знания на реальных датасетах. 
                Создавайте портфолио проектов.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Preview */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Программа курса
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              8 модулей от основ до практического применения
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Введение в ML", desc: "Основы и примеры", icon: "🎯" },
              { title: "Работа с данными", desc: "Типы и визуализация", icon: "📊" },
              { title: "Линейная регрессия", desc: "Первый алгоритм", icon: "📈" },
              { title: "Классификация", desc: "Логистическая регрессия", icon: "🏷️" },
              { title: "Метрики качества", desc: "Оценка моделей", icon: "📏" },
              { title: "Overfitting", desc: "Регуляризация", icon: "⚖️" },
              { title: "Кластеризация", desc: "K-means алгоритм", icon: "🔍" },
              { title: "Мини-проект", desc: "Практика", icon: "🚀" }
            ].map((module, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{module.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Готовы начать изучение ML?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Присоединяйтесь к тысячам студентов, которые уже освоили основы машинного обучения
          </p>
          <Link href="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-colors inline-flex items-center">
            Начать бесплатно
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Brain className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">ML Interactive Course</span>
            </div>
            <p className="text-gray-400">
              © 2024 ML Interactive Course. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
