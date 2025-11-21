'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Brain, RefreshCw, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

// Динамический импорт Plotly для избежания SSR проблем
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as any

interface ClassificationData {
  x: number[][]
  y: number[]
  x_train: number[][]
  y_train: number[]
  x_test: number[][]
  y_test: number[]
  y_pred: number[]
  accuracy: number
  precision: number
  recall: number
  f1: number
  decision_boundary?: number[][]
  probabilities?: number[][]
}

interface SimulatorParams {
  n_samples: number
  n_features: number
  n_classes: number
  noise: number
  random_state: number
}

export default function LogisticRegressionSimulator() {
  const [data, setData] = useState<ClassificationData | null>(null)
  const [params, setParams] = useState<SimulatorParams>({
    n_samples: 200,
    n_features: 2,
    n_classes: 2,
    noise: 0.1,
    random_state: 42
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'scatter' | 'boundary' | 'metrics'>('scatter')

  // Загружаем начальные данные
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/api/ml/logistic-regression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(params)
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

  const handleParamChange = (param: keyof SimulatorParams, value: number) => {
    setParams(prev => ({ ...prev, [param]: value }))
  }

  const resetParams = () => {
    setParams({
      n_samples: 200,
      n_features: 2,
      n_classes: 2,
      noise: 0.1,
      random_state: 42
    })
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка симулятора...</p>
      </div>
    )
  }

  const renderScatterPlot = () => (
    <Plot
      data={[
        {
          x: data.x_train.map(p => p[0]),
          y: data.x_train.map(p => p[1]),
          type: 'scatter',
          mode: 'markers',
          name: 'Обучающие данные',
          marker: {
            color: data.y_train,
            colorscale: [[0, '#3B82F6'], [1, '#EF4444']],
            size: 8,
            showscale: true,
            colorbar: { title: 'Класс' }
          }
        },
        {
          x: data.x_test.map(p => p[0]),
          y: data.x_test.map(p => p[1]),
          type: 'scatter',
          mode: 'markers',
          name: 'Тестовые данные',
          marker: {
            color: data.y_test,
            colorscale: [[0, '#60A5FA'], [1, '#F87171']],
            size: 10,
            symbol: 'circle-open',
            line: { width: 2 }
          }
        }
      ]}
      layout={{
        title: 'Данные для классификации',
        xaxis: { title: 'Признак 1' },
        yaxis: { title: 'Признак 2' },
        hovermode: 'closest',
        legend: { orientation: 'h', y: -0.2 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 40, r: 20, b: 40, t: 40 }
      }}
      config={{ responsive: true }}
      style={{ width: '100%', height: '500px' }}
    />
  )

  const renderDecisionBoundary = () => {
    if (!data.decision_boundary) return null

    const boundaryData = data.decision_boundary
    const x_values = boundaryData.map(p => p[0])
    const y_values = boundaryData.map(p => p[1])
    const z_values = boundaryData.map(p => p[2])

    return (
      <Plot
        data={[
          {
            x: x_values,
            y: y_values,
            z: z_values,
            type: 'contour',
            name: 'Граница решений',
            colorscale: [[0, '#3B82F6'], [1, '#EF4444']],
            showscale: false,
            contours: { coloring: 'lines' }
          },
          {
            x: data.x.map(p => p[0]),
            y: data.x.map(p => p[1]),
            type: 'scatter',
            mode: 'markers',
            name: 'Данные',
            marker: {
              color: data.y,
              colorscale: [[0, '#3B82F6'], [1, '#EF4444']],
              size: 6
            }
          }
        ]}
        layout={{
          title: 'Граница решений логистической регрессии',
          xaxis: { title: 'Признак 1' },
          yaxis: { title: 'Признак 2' },
          hovermode: 'closest',
          legend: { orientation: 'h', y: -0.2 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          margin: { l: 40, r: 20, b: 40, t: 40 }
        }}
        config={{ responsive: true }}
        style={{ width: '100%', height: '500px' }}
      />
    )
  }

  const renderMetrics = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card text-center">
        <div className="text-2xl font-bold text-blue-600">{(data.accuracy * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-600">Accuracy</div>
      </div>
      <div className="card text-center">
        <div className="text-2xl font-bold text-green-600">{(data.precision * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-600">Precision</div>
      </div>
      <div className="card text-center">
        <div className="text-2xl font-bold text-orange-600">{(data.recall * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-600">Recall</div>
      </div>
      <div className="card text-center">
        <div className="text-2xl font-bold text-purple-600">{(data.f1 * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-600">F1-Score</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Симулятор логистической регрессии
        </h2>
        <p className="text-gray-600">
          Исследуйте, как логистическая регрессия разделяет данные на классы
        </p>
      </div>

      {/* Панель управления */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Параметры модели
          </h3>
          <button
            onClick={resetParams}
            className="btn-secondary text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Сбросить
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество примеров
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={params.n_samples}
              onChange={(e) => handleParamChange('n_samples', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.n_samples}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень шума
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={params.noise}
              onChange={(e) => handleParamChange('noise', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.noise}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Случайное состояние
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={params.random_state}
              onChange={(e) => handleParamChange('random_state', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.random_state}</span>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn-primary mt-4 w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Выполняется...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Запустить симуляцию
            </>
          )}
        </button>
      </div>

      {/* Вкладки */}
      <div className="card">
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('scatter')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scatter'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Данные
            </button>
            <button
              onClick={() => setActiveTab('boundary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'boundary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Граница решений
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Метрики
            </button>
          </nav>
        </div>

        {/* Содержимое вкладок */}
        <div className="mt-4">
          {activeTab === 'scatter' && renderScatterPlot()}
          {activeTab === 'boundary' && renderDecisionBoundary()}
          {activeTab === 'metrics' && renderMetrics()}
        </div>
      </div>

      {/* Интерпретация */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Интерпретация результатов</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Метрики качества:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><strong>Accuracy:</strong> Общая точность классификации</li>
              <li><strong>Precision:</strong> Точность положительных предсказаний</li>
              <li><strong>Recall:</strong> Полнота нахождения положительных примеров</li>
              <li><strong>F1-Score:</strong> Баланс между precision и recall</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Граница решений:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Кривая показывает, где модель меняет решение</li>
              <li>Область выше кривой → класс 1</li>
              <li>Область ниже кривой → класс 0</li>
              <li>Чем дальше от границы, тем увереннее предсказание</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
