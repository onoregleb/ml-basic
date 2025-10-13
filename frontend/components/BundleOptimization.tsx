'use client'

import { lazy, Suspense } from 'react'

// Динамически импортируем тяжелые компоненты только при необходимости
const Plot = lazy(() => 
  import('react-plotly.js')
    .then(module => ({ default: module.default }))
    .catch(() => {
      // Fallback компонент при ошибке загрузки
      return { default: () => <div>Ошибка загрузки графика</div> }
    })
)

// Легкий fallback компонент для графиков
const PlotFallback = () => (
  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600 text-sm">Загрузка графика...</p>
    </div>
  </div>
)

// HOC для lazy loading тяжелых компонентов
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = lazy(() => 
    Promise.resolve({ default: Component })
  )
  
  return (props: P) => (
    <Suspense fallback={fallback ? <fallback /> : <div>Загрузка...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// Оптимизированный компонент для Plotly
export const OptimizedPlot = ({ data, layout, config, ...props }: any) => (
  <Suspense fallback={<PlotFallback />}>
    <Plot 
      data={data} 
      layout={{
        // Базовые оптимизации для всех графиков
        autosize: true,
        margin: { t: 30, r: 30, b: 30, l: 40 },
        font: { size: 12 },
        ...layout
      }}
      config={{
        // Отключаем ненужные функции для производительности
        displayModeBar: false,
        staticPlot: false,
        responsive: true,
        ...config
      }}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
      {...props}
    />
  </Suspense>
)

// Вспомогательная функция для предзагрузки критических ресурсов
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return

  // Предзагружаем важные модули
  const criticalModules = [
    () => import('react-plotly.js'),
  ]

  // Запускаем предзагрузку с задержкой, чтобы не блокировать основной поток
  setTimeout(() => {
    criticalModules.forEach(moduleLoader => {
      moduleLoader().catch(() => {
        // Игнорируем ошибки предзагрузки
      })
    })
  }, 2000)
}

export default OptimizedPlot
