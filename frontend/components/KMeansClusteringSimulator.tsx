'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Target, RefreshCw, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

// Динамический импорт Plotly для избежания SSR проблем
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
}) as any

interface ClusteringData {
  x: number[][]
  labels: number[]
  centroids: number[][]
  silhouette_score: number
  wcss: number
}

interface SimulatorParams {
  n_samples: number
  n_features: number
  n_clusters: number
  cluster_std: number
  random_state: number
}

export default function KMeansClusteringSimulator() {
  const [data, setData] = useState<ClusteringData | null>(null)
  const [params, setParams] = useState<SimulatorParams>({
    n_samples: 300,
    n_features: 2,
    n_clusters: 3,
    cluster_std: 1.0,
    random_state: 42
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'clusters' | 'centroids' | 'metrics'>('clusters')

  // Загружаем начальные данные
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/api/ml/kmeans-clustering', {
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
      n_samples: 300,
      n_features: 2,
      n_clusters: 3,
      cluster_std: 1.0,
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

  const renderClustersPlot = () => {
    // Создаем цвета для кластеров
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4']

    const plotData = []
    const uniqueLabels = [...new Set(data.labels)]

    // Добавляем точки каждого кластера
    uniqueLabels.forEach((label, index) => {
      const clusterPoints = data.x.filter((_, i) => data.labels[i] === label)

      plotData.push({
        x: clusterPoints.map(p => p[0]),
        y: clusterPoints.map(p => p[1]),
        type: 'scatter',
        mode: 'markers',
        name: `Кластер ${label}`,
        marker: {
          color: colors[index % colors.length],
          size: 8
        }
      })
    })

    // Добавляем центроиды
    plotData.push({
      x: data.centroids.map(c => c[0]),
      y: data.centroids.map(c => c[1]),
      type: 'scatter',
      mode: 'markers',
      name: 'Центроиды',
      marker: {
        color: 'black',
        size: 12,
        symbol: 'star'
      }
    })

    return (
      <Plot
        data={plotData}
        layout={{
          title: 'Результаты кластеризации K-means',
          xaxis: { title: 'Признак 1' },
          yaxis: { title: 'Признак 2' },
          hovermode: 'closest',
          legend: { x: 0, y: 1 }
        }}
        config={{ responsive: true }}
        style={{ width: '100%', height: '500px' }}
      />
    )
  }

  const renderCentroidsPlot = () => {
    // Визуализация движения центроидов (для демонстрации)
    const colors = ['#3B82F6', '#EF4444', '#10B981']

    const plotData = []

    // Исходные центроиды (случайные)
    const initialCentroids = data.centroids.map((c, i) => [c[0] + (Math.random() - 0.5) * 2, c[1] + (Math.random() - 0.5) * 2])

    // Добавляем точки
    plotData.push({
      x: data.x.map(p => p[0]),
      y: data.x.map(p => p[1]),
      type: 'scatter',
      mode: 'markers',
      name: 'Данные',
      marker: {
        color: data.labels,
        colorscale: [[0, '#3B82F6'], [1, '#EF4444'], [2, '#10B981']],
        size: 6,
        showscale: true,
        colorbar: { title: 'Кластер' }
      }
    })

    // Финальные центроиды
    plotData.push({
      x: data.centroids.map(c => c[0]),
      y: data.centroids.map(c => c[1]),
      type: 'scatter',
      mode: 'markers',
      name: 'Финальные центроиды',
      marker: {
        color: 'black',
        size: 12,
        symbol: 'star'
      }
    })

    return (
      <Plot
        data={plotData}
        layout={{
          title: 'Центроиды и их движение',
          xaxis: { title: 'Признак 1' },
          yaxis: { title: 'Признак 2' },
          hovermode: 'closest'
        }}
        config={{ responsive: true }}
        style={{ width: '100%', height: '500px' }}
      />
    )
  }

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{data.silhouette_score.toFixed(3)}</div>
          <div className="text-sm text-gray-600">Silhouette Score</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.silhouette_score > 0.7 ? 'Отличная кластеризация' :
             data.silhouette_score > 0.5 ? 'Хорошая кластеризация' :
             data.silhouette_score > 0.25 ? 'Слабая кластеризация' :
             'Плохая кластеризация'}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{data.wcss.toFixed(0)}</div>
          <div className="text-sm text-gray-600">WCSS</div>
          <div className="text-xs text-gray-500 mt-1">
            Within-Cluster Sum of Squares
          </div>
        </div>
      </div>

      {/* Анализ кластеров */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-4">Анализ кластеров</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {data.centroids.map((centroid, index) => {
            const clusterPoints = data.x.filter((_, i) => data.labels[i] === index)
            return (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">Кластер {index}</div>
                <div className="text-sm text-gray-600">Центроид: ({centroid[0].toFixed(2)}, {centroid[1].toFixed(2)})</div>
                <div className="text-sm text-gray-600">Размер: {clusterPoints.length} точек</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Симулятор K-means кластеризации
        </h2>
        <p className="text-gray-600">
          Наблюдайте, как алгоритм K-means группирует похожие объекты
        </p>
      </div>

      {/* Панель управления */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Параметры алгоритма
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
              Количество кластеров
            </label>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={params.n_clusters}
              onChange={(e) => handleParamChange('n_clusters', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.n_clusters}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Разброс кластеров
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={params.cluster_std}
              onChange={(e) => handleParamChange('cluster_std', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.cluster_std}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество точек
            </label>
            <input
              type="range"
              min="100"
              max="500"
              step="50"
              value={params.n_samples}
              onChange={(e) => handleParamChange('n_samples', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{params.n_samples}</span>
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
              <Target className="h-4 w-4 mr-2" />
              Запустить кластеризацию
            </>
          )}
        </button>
      </div>

      {/* Вкладки */}
      <div className="card">
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('clusters')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clusters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Кластеры
            </button>
            <button
              onClick={() => setActiveTab('centroids')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'centroids'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Центроиды
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
          {activeTab === 'clusters' && renderClustersPlot()}
          {activeTab === 'centroids' && renderCentroidsPlot()}
          {activeTab === 'metrics' && renderMetrics()}
        </div>
      </div>

      {/* Интерпретация */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Как работает K-means</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-medium">Инициализация</h4>
              <p className="text-sm text-gray-600">Алгоритм выбирает K случайных точек как начальные центроиды кластеров.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-medium">Назначение</h4>
              <p className="text-sm text-gray-600">Каждая точка данных назначается ближайшему центроиду.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-medium">Пересчет</h4>
              <p className="text-sm text-gray-600">Центроиды пересчитываются как среднее арифметическое точек своего кластера.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">4</span>
            </div>
            <div>
              <h4 className="font-medium">Итерация</h4>
              <p className="text-sm text-gray-600">Шаги 2-3 повторяются до сходимости алгоритма.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
