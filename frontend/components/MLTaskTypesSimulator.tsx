'use client'

import React, { useState, useMemo } from 'react'
import { OptimizedPlot } from './BundleOptimization'

type TaskType = 'classification' | 'regression' | 'clustering'

interface DataPoint {
  x: number
  y: number
  category?: string
  value?: number
  cluster?: number
}

interface TaskExample {
  title: string
  description: string
  realWorldExample: string
  features: string[]
  target: string
}

const taskExamples: Record<TaskType, TaskExample> = {
  classification: {
    title: 'Классификация',
    description: 'Определение категории или класса объекта. Предсказываем дискретные метки.',
    realWorldExample: 'Определение, является ли email спамом или нет',
    features: ['Длина текста', 'Количество ссылок', 'Ключевые слова'],
    target: 'Спам (Да/Нет)'
  },
  regression: {
    title: 'Регрессия', 
    description: 'Предсказание числового значения. Предсказываем непрерывные величины.',
    realWorldExample: 'Предсказание цены дома на основе его характеристик',
    features: ['Площадь', 'Количество комнат', 'Расположение'],
    target: 'Цена (в рублях)'
  },
  clustering: {
    title: 'Кластеризация',
    description: 'Группировка похожих объектов без заранее известных меток.',
    realWorldExample: 'Сегментация клиентов по поведению для маркетинга',
    features: ['Частота покупок', 'Средний чек', 'Категории товаров'],
    target: 'Группы клиентов (неизвестны заранее)'
  }
}

const generateSampleData = (taskType: TaskType, noise: number = 0.2): DataPoint[] => {
  const points: DataPoint[] = []
  const numPoints = 100

  switch (taskType) {
    case 'classification':
      // Генерируем данные для бинарной классификации
      for (let i = 0; i < numPoints; i++) {
        const x = Math.random() * 10
        const y = Math.random() * 10
        // Создаем некоторое разделение с добавлением шума
        const isClassA = (x + y + Math.random() * noise * 10) > 10
        points.push({
          x,
          y,
          category: isClassA ? 'Класс A' : 'Класс B'
        })
      }
      break

    case 'regression':
      // Генерируем данные с линейной зависимостью + шум
      for (let i = 0; i < numPoints; i++) {
        const x = Math.random() * 10
        const y = 2 * x + 1 + (Math.random() - 0.5) * noise * 8 // y = 2x + 1 + шум
        points.push({
          x,
          y,
          value: y
        })
      }
      break

    case 'clustering':
      // Генерируем 3 кластера
      const clusters = [
        { centerX: 2, centerY: 2, color: 'Кластер 1' },
        { centerX: 7, centerY: 3, color: 'Кластер 2' },
        { centerX: 5, centerY: 8, color: 'Кластер 3' }
      ]
      
      clusters.forEach((cluster, clusterIdx) => {
        for (let i = 0; i < numPoints / 3; i++) {
          const angle = Math.random() * 2 * Math.PI
          const radius = Math.random() * 1.5
          const x = cluster.centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * noise * 2
          const y = cluster.centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * noise * 2
          points.push({
            x,
            y,
            cluster: clusterIdx,
            category: cluster.color
          })
        }
      })
      break
  }

  return points
}

export default function MLTaskTypesSimulator() {
  const [selectedTask, setSelectedTask] = useState<TaskType>('classification')
  const [noise, setNoise] = useState(0.2)
  const [showLabels, setShowLabels] = useState(true)

  const data = useMemo(() => generateSampleData(selectedTask, noise), [selectedTask, noise])
  const currentExample = taskExamples[selectedTask]

  const plotData = useMemo(() => {
    switch (selectedTask) {
      case 'classification':
        const classA = data.filter(d => d.category === 'Класс A')
        const classB = data.filter(d => d.category === 'Класс B')
        
        return [
          {
            x: classA.map(d => d.x),
            y: classA.map(d => d.y),
            mode: 'markers' as const,
            type: 'scatter' as const,
            name: showLabels ? 'Класс A' : 'Данные',
            marker: { color: showLabels ? '#3B82F6' : '#8B5CF6', size: 8 },
            showlegend: showLabels
          },
          {
            x: classB.map(d => d.x),
            y: classB.map(d => d.y),
            mode: 'markers' as const,
            type: 'scatter' as const,
            name: showLabels ? 'Класс B' : '',
            marker: { color: showLabels ? '#EF4444' : '#8B5CF6', size: 8 },
            showlegend: showLabels
          }
        ]

      case 'regression':
        return [
          {
            x: data.map(d => d.x),
            y: data.map(d => d.y),
            mode: 'markers' as const,
            type: 'scatter' as const,
            name: 'Данные',
            marker: { 
              color: data.map(d => d.value),
              colorscale: 'Viridis' as const,
              size: 8,
              showscale: true,
              colorbar: { title: 'Значение' }
            }
          }
        ]

      case 'clustering':
        const clusters = ['Кластер 1', 'Кластер 2', 'Кластер 3']
        const colors = ['#3B82F6', '#EF4444', '#10B981']
        
        return clusters.map((clusterName, idx) => {
          const clusterData = data.filter(d => d.category === clusterName)
          return {
            x: clusterData.map(d => d.x),
            y: clusterData.map(d => d.y),
            mode: 'markers' as const,
            type: 'scatter' as const,
            name: showLabels ? clusterName : 'Данные',
            marker: { 
              color: showLabels ? colors[idx] : '#8B5CF6', 
              size: 8 
            },
            showlegend: showLabels
          }
        })
    }
  }, [data, selectedTask, showLabels])

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Интерактивный симулятор типов задач ML 🤖
        </h3>
        <p className="text-gray-600">
          Изучите разницу между классификацией, регрессией и кластеризацией на интерактивных примерах
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Панель управления */}
        <div className="space-y-6">
          {/* Выбор типа задачи */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Тип задачи ML:
            </label>
            <div className="space-y-2">
              {(Object.keys(taskExamples) as TaskType[]).map((taskType) => (
                <button
                  key={taskType}
                  onClick={() => setSelectedTask(taskType)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedTask === taskType
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">
                    {taskExamples[taskType].title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {taskExamples[taskType].description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Настройки */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Уровень шума: {noise.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={noise}
                onChange={(e) => setNoise(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 mt-1">
                Добавляет случайность в данные
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Показывать метки/группы
                </span>
              </label>
              <div className="text-xs text-gray-500 mt-1">
                В реальных данных метки могут быть неизвестны
              </div>
            </div>
          </div>

          {/* Информация о текущей задаче */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">
              {currentExample.title}
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              {currentExample.description}
            </p>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">
                💡 Пример из жизни:
              </h5>
              <p className="text-sm text-blue-800 mb-2">
                {currentExample.realWorldExample}
              </p>
              
              <div className="text-xs text-blue-700">
                <strong>Признаки (X):</strong> {currentExample.features.join(', ')}
                <br />
                <strong>Цель (Y):</strong> {currentExample.target}
              </div>
            </div>
          </div>
        </div>

        {/* График */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">
            Визуализация данных
          </h4>
          
          <div style={{ width: '100%', height: '400px' }}>
            <OptimizedPlot
              data={plotData}
              layout={{
                title: {
                  text: `${currentExample.title}: ${showLabels ? 'с метками' : 'без меток'}`,
                  font: { size: 14 }
                },
                xaxis: { 
                  title: 'Признак 1',
                  showgrid: true,
                  zeroline: false,
                  titlefont: { size: 11 }
                },
                yaxis: { 
                  title: 'Признак 2',
                  showgrid: true,
                  zeroline: false,
                  titlefont: { size: 11 }
                },
                showlegend: showLabels && selectedTask !== 'regression',
                margin: { l: 40, r: 20, b: 40, t: 40 },
                legend: { orientation: 'h', y: -0.2 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { size: 10 }
              }}
              config={{
                displayModeBar: false,
                responsive: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div className="mt-3 text-xs text-gray-600">
            {selectedTask === 'classification' && 'Разные цвета = разные классы'}
            {selectedTask === 'regression' && 'Цвет точки = предсказываемое значение'}
            {selectedTask === 'clustering' && 'Группы точек = обнаруженные кластеры'}
          </div>
        </div>
      </div>

      {/* Ключевые отличия */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border-2 ${selectedTask === 'classification' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <h5 className="font-semibold text-gray-900 mb-2">🎯 Классификация</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Обучение с учителем</li>
            <li>• Дискретные классы</li>
            <li>• Метки известны</li>
            <li>• Пример: спам/не спам</li>
          </ul>
        </div>

        <div className={`p-4 rounded-lg border-2 ${selectedTask === 'regression' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <h5 className="font-semibold text-gray-900 mb-2">📈 Регрессия</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Обучение с учителем</li>
            <li>• Непрерывные значения</li>
            <li>• Числовые цели</li>
            <li>• Пример: цена дома</li>
          </ul>
        </div>

        <div className={`p-4 rounded-lg border-2 ${selectedTask === 'clustering' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <h5 className="font-semibold text-gray-900 mb-2">🔍 Кластеризация</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Обучение без учителя</li>
            <li>• Скрытые группы</li>
            <li>• Метки неизвестны</li>
            <li>• Пример: сегменты клиентов</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h5 className="font-semibold text-amber-900 mb-2">💡 Совет для изучения:</h5>
        <p className="text-sm text-amber-800">
          Попробуйте увеличить уровень шума и отключить метки, чтобы понять, 
          как выглядят реальные данные и насколько сложно может быть их анализировать!
        </p>
      </div>
    </div>
  )
}
