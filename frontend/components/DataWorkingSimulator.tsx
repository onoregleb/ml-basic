'use client'

import React, { useState, useMemo } from 'react'
import { OptimizedPlot } from './BundleOptimization'

type DataType = 'numerical' | 'categorical' | 'mixed'
type ScalingMethod = 'none' | 'standard' | 'minmax'
type OutlierHandling = 'none' | 'remove' | 'clip'

interface DataPoint {
  id: number
  feature1: number
  feature2: number
  category: string
  age: number
  salary: number
  education: string
  isOutlier?: boolean
}

const generateSampleData = (dataType: DataType, includeOutliers: boolean = true): DataPoint[] => {
  const data: DataPoint[] = []
  const categories = ['A', 'B', 'C']
  const educationLevels = ['Начальное', 'Среднее', 'Высшее']
  
  for (let i = 0; i < 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const education = educationLevels[Math.floor(Math.random() * educationLevels.length)]
    
    let feature1, feature2, age, salary
    
    switch (dataType) {
      case 'numerical':
        // Числовые данные с нормальным распределением
        feature1 = Math.random() * 50 + 25  // 25-75
        feature2 = Math.random() * 100 + 50 // 50-150
        age = Math.floor(Math.random() * 40) + 22 // 22-62
        salary = Math.floor(Math.random() * 80000) + 30000 // 30k-110k
        break
        
      case 'categorical':
        // Категориальные данные (закодированы в числа)
        feature1 = categories.indexOf(category) + Math.random() * 0.2 // 0, 1, 2 + шум
        feature2 = educationLevels.indexOf(education) + Math.random() * 0.2
        age = Math.floor(Math.random() * 40) + 22
        salary = Math.floor(Math.random() * 80000) + 30000
        break
        
      case 'mixed':
        // Смешанные данные
        feature1 = Math.random() * 50 + 25
        feature2 = educationLevels.indexOf(education) + Math.random() * 0.2
        age = Math.floor(Math.random() * 40) + 22
        salary = Math.floor(Math.random() * 80000) + 30000
        break
    }
    
    data.push({
      id: i,
      feature1,
      feature2,
      category,
      age,
      salary,
      education,
      isOutlier: false
    })
  }
  
  // Добавляем выбросы
  if (includeOutliers) {
    for (let i = 0; i < 5; i++) {
      const outlierMultiplier = Math.random() > 0.5 ? 3 : 0.2
      data.push({
        id: 100 + i,
        feature1: (Math.random() * 50 + 25) * outlierMultiplier,
        feature2: (Math.random() * 100 + 50) * outlierMultiplier,
        category: categories[Math.floor(Math.random() * categories.length)],
        age: Math.floor(Math.random() * 40) + 22,
        salary: Math.floor((Math.random() * 80000 + 30000) * outlierMultiplier),
        education: educationLevels[Math.floor(Math.random() * educationLevels.length)],
        isOutlier: true
      })
    }
  }
  
  return data
}

const scaleData = (data: DataPoint[], method: ScalingMethod): DataPoint[] => {
  if (method === 'none') return data
  
  const feature1Values = data.map(d => d.feature1)
  const feature2Values = data.map(d => d.feature2)
  
  let scaledData = [...data]
  
  if (method === 'standard') {
    // Z-score нормализация
    const mean1 = feature1Values.reduce((a, b) => a + b, 0) / feature1Values.length
    const std1 = Math.sqrt(feature1Values.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / feature1Values.length)
    
    const mean2 = feature2Values.reduce((a, b) => a + b, 0) / feature2Values.length
    const std2 = Math.sqrt(feature2Values.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / feature2Values.length)
    
    scaledData = data.map(d => ({
      ...d,
      feature1: (d.feature1 - mean1) / std1,
      feature2: (d.feature2 - mean2) / std2
    }))
  } else if (method === 'minmax') {
    // Min-Max нормализация
    const min1 = Math.min(...feature1Values)
    const max1 = Math.max(...feature1Values)
    const min2 = Math.min(...feature2Values)
    const max2 = Math.max(...feature2Values)
    
    scaledData = data.map(d => ({
      ...d,
      feature1: (d.feature1 - min1) / (max1 - min1),
      feature2: (d.feature2 - min2) / (max2 - min2)
    }))
  }
  
  return scaledData
}

const handleOutliers = (data: DataPoint[], method: OutlierHandling): DataPoint[] => {
  if (method === 'none') return data
  
  if (method === 'remove') {
    return data.filter(d => !d.isOutlier)
  }
  
  if (method === 'clip') {
    // Обрезаем выбросы до 95-го процентиля
    const feature1Values = data.map(d => d.feature1).sort((a, b) => a - b)
    const feature2Values = data.map(d => d.feature2).sort((a, b) => a - b)
    
    const percentile95_1 = feature1Values[Math.floor(feature1Values.length * 0.95)]
    const percentile5_1 = feature1Values[Math.floor(feature1Values.length * 0.05)]
    const percentile95_2 = feature2Values[Math.floor(feature2Values.length * 0.95)]
    const percentile5_2 = feature2Values[Math.floor(feature2Values.length * 0.05)]
    
    return data.map(d => ({
      ...d,
      feature1: Math.min(Math.max(d.feature1, percentile5_1), percentile95_1),
      feature2: Math.min(Math.max(d.feature2, percentile5_2), percentile95_2)
    }))
  }
  
  return data
}

export default function DataWorkingSimulator() {
  const [dataType, setDataType] = useState<DataType>('numerical')
  const [scalingMethod, setScalingMethod] = useState<ScalingMethod>('none')
  const [outlierHandling, setOutlierHandling] = useState<OutlierHandling>('none')
  const [showOutliers, setShowOutliers] = useState(true)
  const [plotType, setPlotType] = useState<'scatter' | 'histogram' | 'box'>('scatter')

  const rawData = useMemo(() => generateSampleData(dataType, showOutliers), [dataType, showOutliers])
  
  const processedData = useMemo(() => {
    let data = handleOutliers(rawData, outlierHandling)
    data = scaleData(data, scalingMethod)
    return data
  }, [rawData, scalingMethod, outlierHandling])

  const plotData = useMemo(() => {
    switch (plotType) {
      case 'scatter':
        const normalPoints = processedData.filter(d => !d.isOutlier)
        const outlierPoints = processedData.filter(d => d.isOutlier)
        
        const traces: any[] = [
          {
            x: normalPoints.map(d => d.feature1),
            y: normalPoints.map(d => d.feature2),
            mode: 'markers' as const,
            type: 'scatter' as const,
            name: 'Нормальные данные',
            marker: { 
              color: normalPoints.map(d => d.category === 'A' ? '#3B82F6' : d.category === 'B' ? '#EF4444' : '#10B981'), 
              size: 8 
            }
          }
        ]
        
        if (outlierPoints.length > 0) {
          traces.push({
            x: outlierPoints.map(d => d.feature1),
            y: outlierPoints.map(d => d.feature2),
            mode: 'markers' as const,
            type: 'scatter' as const,
            name: 'Выбросы',
            marker: { color: '#F59E0B', size: 12, symbol: 'diamond' }
          })
        }
        
        return traces
        
      case 'histogram':
        return [
          {
            x: processedData.map(d => d.feature1),
            type: 'histogram' as const,
            name: 'Признак 1',
            opacity: 0.7,
            marker: { color: '#3B82F6' }
          },
          {
            x: processedData.map(d => d.feature2),
            type: 'histogram' as const,
            name: 'Признак 2',
            opacity: 0.7,
            marker: { color: '#EF4444' }
          }
        ]
        
      case 'box':
        return [
          {
            y: processedData.map(d => d.feature1),
            type: 'box' as const,
            name: 'Признак 1',
            marker: { color: '#3B82F6' }
          },
          {
            y: processedData.map(d => d.feature2),
            type: 'box' as const,
            name: 'Признак 2',
            marker: { color: '#EF4444' }
          }
        ]
    }
  }, [processedData, plotType])

  const getScalingDescription = () => {
    switch (scalingMethod) {
      case 'none': return 'Данные в исходном масштабе'
      case 'standard': return 'Z-score нормализация: (x - μ) / σ'
      case 'minmax': return 'Min-Max нормализация: (x - min) / (max - min)'
    }
  }

  const getOutlierDescription = () => {
    switch (outlierHandling) {
      case 'none': return 'Выбросы не обрабатываются'
      case 'remove': return 'Выбросы удалены из данных'
      case 'clip': return 'Выбросы обрезаны до 5-95 процентилей'
    }
  }

  const dataTypeDescriptions = {
    numerical: 'Непрерывные числовые данные (возраст, зарплата)',
    categorical: 'Категориальные данные, преобразованные в числа',
    mixed: 'Смешанные данные: числовые + категориальные'
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Симулятор работы с данными 📊
        </h3>
        <p className="text-gray-600">
          Изучите различные типы данных, методы масштабирования и обработки выбросов
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Панель управления */}
        <div className="space-y-6">
          {/* Тип данных */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип данных:
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as DataType)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="numerical">Числовые данные</option>
              <option value="categorical">Категориальные данные</option>
              <option value="mixed">Смешанные данные</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              {dataTypeDescriptions[dataType]}
            </p>
          </div>

          {/* Масштабирование */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Метод масштабирования:
            </label>
            <select
              value={scalingMethod}
              onChange={(e) => setScalingMethod(e.target.value as ScalingMethod)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="none">Без масштабирования</option>
              <option value="standard">Стандартизация (Z-score)</option>
              <option value="minmax">Min-Max нормализация</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              {getScalingDescription()}
            </p>
          </div>

          {/* Обработка выбросов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Обработка выбросов:
            </label>
            <select
              value={outlierHandling}
              onChange={(e) => setOutlierHandling(e.target.value as OutlierHandling)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="none">Не обрабатывать</option>
              <option value="remove">Удалить</option>
              <option value="clip">Обрезать (клипировать)</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              {getOutlierDescription()}
            </p>
          </div>

          {/* Настройки */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOutliers}
                onChange={(e) => setShowOutliers(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Включить выбросы в данные
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип графика:
              </label>
              <div className="flex space-x-2">
                {[
                  { value: 'scatter', label: 'Точечный' },
                  { value: 'histogram', label: 'Гистограмма' },
                  { value: 'box', label: 'Ящик с усами' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPlotType(value as any)}
                    className={`px-3 py-1 text-xs rounded ${
                      plotType === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Статистики */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">📈 Статистики данных</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Всего точек: {processedData.length}</div>
              <div>Выбросов: {processedData.filter(d => d.isOutlier).length}</div>
              <div>
                Признак 1: μ = {(processedData.reduce((sum, d) => sum + d.feature1, 0) / processedData.length).toFixed(2)}
              </div>
              <div>
                Признак 2: μ = {(processedData.reduce((sum, d) => sum + d.feature2, 0) / processedData.length).toFixed(2)}
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
                  text: `${plotType === 'scatter' ? 'Точечный график' : 
                         plotType === 'histogram' ? 'Гистограмма' : 'Ящик с усами'}`,
                  font: { size: 14 }
                },
                xaxis: { 
                  title: plotType === 'scatter' ? 'Признак 1' : 'Значение',
                  showgrid: true,
                  titlefont: { size: 11 }
                },
                yaxis: { 
                  title: plotType === 'scatter' ? 'Признак 2' : 'Частота/Значение',
                  showgrid: true,
                  titlefont: { size: 11 }
                },
                legend: { orientation: 'h', y: -0.3 },
                margin: { l: 40, r: 20, b: 80, t: 40 },
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
        </div>
      </div>

      {/* Информационные панели */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-900 mb-2">📊 Типы данных</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Числовые: непрерывные значения</li>
            <li>• Категориальные: дискретные группы</li>
            <li>• Смешанные: комбинация типов</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h5 className="font-semibold text-green-900 mb-2">⚖️ Масштабирование</h5>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Z-score: нулевое среднее, единичная дисперсия</li>
            <li>• Min-Max: данные в диапазоне [0,1]</li>
            <li>• Важно для алгоритмов ML</li>
          </ul>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h5 className="font-semibold text-orange-900 mb-2">🎯 Выбросы</h5>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Экстремальные значения</li>
            <li>• Могут исказить модель</li>
            <li>• Удаление vs обрезание</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-semibold text-yellow-900 mb-2">💡 Практический совет:</h5>
        <p className="text-sm text-yellow-800">
          Попробуйте разные комбинации настроек! Посмотрите, как масштабирование влияет на распределение данных,
          а обработка выбросов - на статистики. В реальных проектах правильная подготовка данных критически важна.
        </p>
      </div>
    </div>
  )
}
