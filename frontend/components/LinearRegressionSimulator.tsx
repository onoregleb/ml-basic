'use client'

import { useState, useEffect } from 'react'
import { Sliders, RefreshCw, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { OptimizedPlot } from './BundleOptimization'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'

interface LinearRegressionData {
  x: number[]
  y: number[]
  predicted_y: number[]
  mse: number
  r2: number
}

interface SimulatorParams {
  slope: number
  intercept: number
  noise_level: number
  n_points: number
}

export default function LinearRegressionSimulator() {
  // Мониторинг производительности
  const performanceMetrics = usePerformanceMonitor('LinearRegressionSimulator')
  
  const [data, setData] = useState<LinearRegressionData | null>(null)
  const [params, setParams] = useState<SimulatorParams>({
    slope: 2.0,
    intercept: 1.0,
    noise_level: 0.5,
    n_points: 50
  })
  const [isLoading, setIsLoading] = useState(false)

  // Загружаем начальные данные
  useEffect(() => {
    fetchExampleData()
  }, [])

  const fetchExampleData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/api/ml/linear-regression/example', {
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

  const runSimulation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/api/ml/linear-regression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error('Ошибка симуляции')
      }
      
      const result = await response.json()
      setData(result)
      toast.success('Симуляция завершена!')
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Не удалось выполнить симуляцию')
    } finally {
      setIsLoading(false)
    }
  }

  const handleParamChange = (param: keyof SimulatorParams, value: number) => {
    setParams(prev => ({ ...prev, [param]: value }))
  }

  const resetParams = () => {
    setParams({
      slope: 2.0,
      intercept: 1.0,
      noise_level: 0.5,
      n_points: 50
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

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Интерактивный симулятор линейной регрессии
        </h2>
        <p className="text-gray-600">
          Экспериментируйте с параметрами и наблюдайте, как меняется модель
        </p>
      </div>

      {/* Панель управления */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sliders className="h-5 w-5 mr-2" />
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Наклон (Slope)
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={params.slope}
              onChange={(e) => handleParamChange('slope', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.slope}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пересечение (Intercept)
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={params.intercept}
              onChange={(e) => handleParamChange('intercept', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.intercept}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень шума
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={params.noise_level}
              onChange={(e) => handleParamChange('noise_level', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.noise_level}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество точек
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={params.n_points}
              onChange={(e) => handleParamChange('n_points', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.n_points}</span>
          </div>
        </div>

        <button
          onClick={runSimulation}
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
              <TrendingUp className="h-4 w-4 mr-2" />
              Запустить симуляцию
            </>
          )}
        </button>
      </div>

      {/* График */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Визуализация</h3>
        <div className="h-96">
          <OptimizedPlot
            data={[
              {
                x: data.x,
                y: data.y,
                type: 'scatter',
                mode: 'markers',
                name: 'Исходные данные',
                marker: { color: 'blue', size: 6 }
              },
              {
                x: data.x,
                y: data.predicted_y,
                type: 'scatter',
                mode: 'lines',
                name: 'Предсказание модели',
                line: { color: 'red', width: 3 }
              }
            ]}
            layout={{
              title: 'Линейная регрессия',
              xaxis: { title: 'X' },
              yaxis: { title: 'Y' },
              hovermode: 'closest',
              legend: { orientation: 'h', y: -0.2 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              margin: { l: 40, r: 20, b: 40, t: 40 }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Метрики */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Метрики качества</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">MSE (Mean Squared Error):</span>
              <span className="font-mono font-semibold">{data.mse.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">R² (R-squared):</span>
              <span className="font-mono font-semibold">{data.r2.toFixed(4)}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>MSE</strong> — средняя квадратичная ошибка. Чем меньше, тем лучше.
              <br />
              <strong>R²</strong> — коэффициент детерминации. Ближе к 1 — лучше.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Интерпретация</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Наклон (Slope):</strong> показывает, насколько быстро изменяется Y при изменении X.
            </p>
            <p>
              <strong>Пересечение (Intercept):</strong> значение Y при X = 0.
            </p>
            <p>
              <strong>Уровень шума:</strong> случайные отклонения от идеальной прямой.
            </p>
            <p>
              <strong>Количество точек:</strong> больше точек = более точная оценка параметров.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
