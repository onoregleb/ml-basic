'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

// Динамический импорт Plotly для избежания SSR проблем
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as any

interface MetricsData {
  scenarios: {
    scenario: string
    balanced: {
      accuracy: number
      precision: number
      recall: number
      f1: number
    }
    imbalanced: {
      accuracy: number
      precision: number
      recall: number
      f1: number
    }
  }[]
}

export default function MetricsComparisonSimulator() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'comparison' | 'analysis'>('comparison')

  // Загружаем начальные данные
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/api/ml/metrics-comparison', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка симулятора...</p>
      </div>
    )
  }

  const renderComparisonPlot = () => {
    const scenarios = data.scenarios.map(s => s.scenario)
    const balancedAccuracy = data.scenarios.map(s => s.balanced.accuracy)
    const imbalancedAccuracy = data.scenarios.map(s => s.imbalanced.accuracy)
    const balancedF1 = data.scenarios.map(s => s.balanced.f1)
    const imbalancedF1 = data.scenarios.map(s => s.imbalanced.f1)

    return (
      <div className="grid md:grid-cols-2 gap-6">
        {/* Accuracy Comparison */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Accuracy</h4>
          <Plot
            data={[
              {
                x: scenarios,
                y: balancedAccuracy,
                type: 'bar',
                name: 'Сбалансированные данные',
                marker: { color: '#10B981' }
              },
              {
                x: scenarios,
                y: imbalancedAccuracy,
                type: 'bar',
                name: 'Несбалансированные данные',
                marker: { color: '#EF4444' }
              }
            ]}
            layout={{
              title: 'Сравнение Accuracy',
              yaxis: { title: 'Accuracy', range: [0, 1] },
              barmode: 'group'
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '300px' }}
          />
        </div>

        {/* F1-Score Comparison */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">F1-Score</h4>
          <Plot
            data={[
              {
                x: scenarios,
                y: balancedF1,
                type: 'bar',
                name: 'Сбалансированные данные',
                marker: { color: '#3B82F6' }
              },
              {
                x: scenarios,
                y: imbalancedF1,
                type: 'bar',
                name: 'Несбалансированные данные',
                marker: { color: '#F59E0B' }
              }
            ]}
            layout={{
              title: 'Сравнение F1-Score',
              yaxis: { title: 'F1-Score', range: [0, 1] },
              barmode: 'group'
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '300px' }}
          />
        </div>
      </div>
    )
  }

  const renderAnalysis = () => {
    const avgBalanced = {
      accuracy: data.scenarios.reduce((sum, s) => sum + s.balanced.accuracy, 0) / data.scenarios.length,
      precision: data.scenarios.reduce((sum, s) => sum + s.balanced.precision, 0) / data.scenarios.length,
      recall: data.scenarios.reduce((sum, s) => sum + s.balanced.recall, 0) / data.scenarios.length,
      f1: data.scenarios.reduce((sum, s) => sum + s.balanced.f1, 0) / data.scenarios.length
    }

    const avgImbalanced = {
      accuracy: data.scenarios.reduce((sum, s) => sum + s.imbalanced.accuracy, 0) / data.scenarios.length,
      precision: data.scenarios.reduce((sum, s) => sum + s.imbalanced.precision, 0) / data.scenarios.length,
      recall: data.scenarios.reduce((sum, s) => sum + s.imbalanced.recall, 0) / data.scenarios.length,
      f1: data.scenarios.reduce((sum, s) => sum + s.imbalanced.f1, 0) / data.scenarios.length
    }

    return (
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Сбалансированные данные</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-bold">{(avgBalanced.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precision:</span>
                <span className="font-bold">{(avgBalanced.precision * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recall:</span>
                <span className="font-bold">{(avgBalanced.recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">F1-Score:</span>
                <span className="font-bold">{(avgBalanced.f1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Несбалансированные данные</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-bold">{(avgImbalanced.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precision:</span>
                <span className="font-bold">{(avgImbalanced.precision * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recall:</span>
                <span className="font-bold">{(avgImbalanced.recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">F1-Score:</span>
                <span className="font-bold">{(avgImbalanced.f1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Ключевые выводы</h4>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Accuracy обманчива</h5>
              <p className="text-sm text-blue-800">
                На несбалансированных данных accuracy может быть высокой (90%+),
                но это не отражает реальное качество модели для minority класса.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">F1-Score более надежна</h5>
              <p className="text-sm text-green-800">
                F1-score лучше показывает качество модели на несбалансированных данных,
                так как учитывает баланс между precision и recall.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-2">Выбор метрики зависит от задачи</h5>
              <p className="text-sm text-yellow-800">
                Для медицинской диагностики важнее recall (не пропустить больных),
                для спам-фильтра — precision (не пометить нормальные письма как спам).
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Рекомендации</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Всегда проверяйте баланс классов в данных</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Используйте F1-score для несбалансированных данных</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Анализируйте confusion matrix для понимания ошибок</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Рассмотрите oversampling/undersampling для баланса</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Сравнение метрик качества
        </h2>
        <p className="text-gray-600">
          Узнайте, почему accuracy может быть обманчивой на несбалансированных данных
        </p>
      </div>

      {/* Панель управления */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Анализ метрик
          </h3>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn-secondary text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="card">
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Сравнение
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Анализ
            </button>
          </nav>
        </div>

        {/* Содержимое вкладок */}
        <div className="mt-4">
          {activeTab === 'comparison' && renderComparisonPlot()}
          {activeTab === 'analysis' && renderAnalysis()}
        </div>
      </div>

      {/* Интерпретация метрик */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Интерпретация метрик</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Основные метрики:</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Accuracy</div>
                <div className="text-sm text-gray-600">Доля правильных предсказаний</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Precision</div>
                <div className="text-sm text-gray-600">Точность положительных предсказаний</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Продвинутые метрики:</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Recall</div>
                <div className="text-sm text-gray-600">Полнота нахождения положительных примеров</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">F1-Score</div>
                <div className="text-sm text-gray-600">Гармоническое среднее precision и recall</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
