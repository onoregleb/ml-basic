'use client'

import React, { lazy, Suspense, memo } from 'react'
import { Play } from 'lucide-react'

// Lazy imports для симуляторов
const LinearRegressionSimulator = lazy(() => import('./LinearRegressionSimulator'))
const LogisticRegressionSimulator = lazy(() => import('./LogisticRegressionSimulator'))
const KNNClassificationSimulator = lazy(() => import('./KNNClassificationSimulator'))
const KMeansClusteringSimulator = lazy(() => import('./KMeansClusteringSimulator'))
const MetricsComparisonSimulator = lazy(() => import('./MetricsComparisonSimulator'))
const MLTaskTypesSimulator = lazy(() => import('./MLTaskTypesSimulator'))
const DataWorkingSimulator = lazy(() => import('./DataWorkingSimulator'))
const OverfittingSimulator = lazy(() => import('./OverfittingSimulator'))
const CustomerSegmentationSimulator = lazy(() => import('./CustomerSegmentationSimulator'))

interface LazySimulatorProps {
  lessonId: number
  title: string
}

// Loading компонент для симуляторов
const SimulatorLoading = () => (
  <div className="p-8 text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
    <p className="text-gray-600">Загрузка интерактивного симулятора...</p>
  </div>
)

// Error boundary компонент
const SimulatorError = ({ error }: { error: Error }) => (
  <div className="p-8 text-center">
    <div className="text-red-500 mb-4">
      ⚠️ Ошибка загрузки симулятора
    </div>
    <p className="text-gray-600 text-sm">
      {error.message || 'Попробуйте обновить страницу'}
    </p>
    <button 
      onClick={() => window.location.reload()}
      className="mt-4 btn-primary"
    >
      Обновить страницу
    </button>
  </div>
)

const LazySimulator = memo(({ lessonId, title }: LazySimulatorProps) => {
  const getSimulatorComponent = () => {
    switch (lessonId) {
      case 1:
        return <MLTaskTypesSimulator />
      case 2:
        return <DataWorkingSimulator />
      case 3:
        return <LinearRegressionSimulator />
      case 4:
        return <LogisticRegressionSimulator />
      case 5:
        return <KNNClassificationSimulator />
      case 6:
        return <MetricsComparisonSimulator />
      case 8:
        return <KMeansClusteringSimulator />
      case 7:
        return <OverfittingSimulator />
      case 9:
        return <CustomerSegmentationSimulator />
      default:
        return null
    }
  }

  const simulatorComponent = getSimulatorComponent()
  
  if (!simulatorComponent) {
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <Play className="h-5 w-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <Suspense fallback={<SimulatorLoading />}>
        <ErrorBoundary>
          {simulatorComponent}
        </ErrorBoundary>
      </Suspense>
    </div>
  )
})

LazySimulator.displayName = 'LazySimulator'

// Простой Error Boundary компонент
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <SimulatorError error={this.state.error!} />
    }

    return this.props.children
  }
}

export default LazySimulator
