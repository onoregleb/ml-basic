'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Users, RefreshCw, Target } from 'lucide-react'
import toast from 'react-hot-toast'

// Динамический импорт Plotly для избежания SSR проблем
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as any

interface KNNData {
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
  decision_boundary: Array<[number, number, number]> | null
}

interface SimulatorParams {
  n_samples: number
  n_features: number
  n_classes: number
  noise: number
  random_state: number
}

export default function KNNClassificationSimulator() {
  const [data, setData] = useState<KNNData | null>(null)
  const [params, setParams] = useState<SimulatorParams>({
    n_samples: 200,
    n_features: 2,
    n_classes: 2,
    noise: 0.1,
    random_state: 42
  })
  const [k, setK] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'data' | 'boundary' | 'metrics'>('data')

  // Загружаем начальные данные
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/api/ml/knn-classification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ k, ...params })
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

  const runSimulation = async () => {
    await fetchData()
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
    setK(5)
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка симулятора...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Интерактивный симулятор kNN классификации
        </h2>
        <p className="text-gray-600">
          Экспериментируйте с параметрами и наблюдайте, как меняется классификация
        </p>
      </div>

      {/* Панель управления */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество соседей (k)
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{k}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество точек
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
              step="0.05"
              value={params.noise}
              onChange={(e) => handleParamChange('noise', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.noise}</span>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Выполняется...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Запустить симуляцию
            </>
          )}
        </button>
      </div>

      {/* Вкладки */}
      <div className="card">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
          {(['data', 'boundary', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'data' ? 'Данные' :
               tab === 'boundary' ? 'Граница решений' :
               'Метрики'}
            </button>
          ))}
        </div>

        <div className="h-96">
          {activeTab === 'data' && (
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
                    colorscale: 'Viridis',
                    size: 8,
                    showscale: true
                  }
                },
                {
                  x: data.x_test.map(p => p[0]),
                  y: data.x_test.map(p => p[1]),
                  type: 'scatter',
                  mode: 'markers',
                  name: 'Тестовые данные',
                  marker: {
                    color: data.y_pred,
                    colorscale: 'Viridis',
                    size: 10,
                    symbol: 'circle-open',
                    line: { width: 2 }
                  }
                }
              ]}
              layout={{
                title: 'kNN Классификация',
                xaxis: { title: 'Признак 1' },
                yaxis: { title: 'Признак 2' },
                hovermode: 'closest',
                legend: { x: 0, y: 1 }
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '100%' }}
            />
          )}

          {activeTab === 'boundary' && data.decision_boundary && (
            <Plot
              data={[
                {
                  x: data.decision_boundary.map(p => p[0]),
                  y: data.decision_boundary.map(p => p[1]),
                  type: 'scatter',
                  mode: 'markers',
                  name: 'Граница решений',
                  marker: {
                    color: data.decision_boundary.map(p => p[2]),
                    colorscale: 'Viridis',
                    size: 3,
                    opacity: 0.3
                  }
                },
                {
                  x: data.x_train.map(p => p[0]),
                  y: data.x_train.map(p => p[1]),
                  type: 'scatter',
                  mode: 'markers',
                  name: 'Обучающие данные',
                  marker: {
                    color: data.y_train,
                    colorscale: 'Viridis',
                    size: 8
                  },
                  showlegend: false
                }
              ]}
              layout={{
                title: 'Граница решений kNN',
                xaxis: { title: 'Признак 1' },
                yaxis: { title: 'Признак 2' },
                hovermode: 'closest'
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '100%' }}
            />
          )}

          {activeTab === 'metrics' && (
            <div className="flex items-center justify-center h-full">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {data.accuracy.toFixed(4)}
                  </div>
                  <div className="text-sm text-blue-700">Accuracy</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {data.precision.toFixed(4)}
                  </div>
                  <div className="text-sm text-green-700">Precision</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    {data.recall.toFixed(4)}
                  </div>
                  <div className="text-sm text-yellow-700">Recall</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {data.f1.toFixed(4)}
                  </div>
                  <div className="text-sm text-purple-700">F1 Score</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Описание */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Как работает kNN?</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>kNN (k-Nearest Neighbors)</strong> — это алгоритм классификации, который:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Находит k ближайших соседей для новой точки</li>
            <li>Определяет класс большинством голосов соседей</li>
            <li>Не требует обучения — все вычисления происходят во время предсказания</li>
            <li>Чувствителен к выбору k и метрике расстояния</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Советы:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Маленькое k → модель более чувствительна к шуму</li>
              <li>• Большое k → модель может упустить локальные особенности</li>
              <li>• Для сложных границ решений используйте маленькое k</li>
              <li>• Для более гладких границ используйте большее k</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
