'use client'

import { usePerformanceIndicatorData } from '../hooks/usePerformanceMonitor'

interface PerformanceIndicatorProps {
  show?: boolean
}

export const PerformanceIndicator = ({ show = false }: PerformanceIndicatorProps) => {
  const { fps, memoryUsage, isSlowDevice } = usePerformanceIndicatorData()
  
  if (!show || process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-2 rounded font-mono z-50">
      <div>FPS: {fps}</div>
      {memoryUsage && (
        <div>Memory: {memoryUsage.toFixed(1)}MB</div>
      )}
      {isSlowDevice && (
        <div className="text-yellow-400">Slow Device</div>
      )}
    </div>
  )
}
