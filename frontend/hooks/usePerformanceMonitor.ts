'use client'

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  componentLoadTime: number
  apiResponseTime: number
  renderTime: number
  memoryUsage: number
  isSlowDevice: boolean
}

// Определяем, является ли устройство слабым
const detectSlowDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const nav = navigator as any
  
  // Проверяем количество ядер процессора
  const cores = nav.hardwareConcurrency || 1
  
  // Проверяем объем памяти (если доступно)
  const memory = nav.deviceMemory || 4 // По умолчанию 4GB
  
  // Проверяем тип соединения
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection
  const slowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g'
  )
  
  // Считаем устройство слабым, если:
  // - Меньше 4 ядер процессора
  // - Меньше 4GB RAM
  // - Медленное соединение
  return cores < 4 || memory < 4 || slowConnection
}

// Хук для мониторинга производительности компонентов
export const usePerformanceMonitor = (componentName: string) => {
  const startTimeRef = useRef<number>(Date.now())
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({})
  
  useEffect(() => {
    const startTime = startTimeRef.current
    const loadTime = Date.now() - startTime
    
    // Измеряем время загрузки компонента
    setMetrics(prev => ({
      ...prev,
      componentLoadTime: loadTime,
      isSlowDevice: detectSlowDevice()
    }))
    
    // Мониторим использование памяти (если доступно)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / (1024 * 1024) // MB
      }))
    }
    
    // Логируем только в development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} loaded in ${loadTime}ms`)
    }
  }, [componentName])
  
  return metrics
}

// Хук для мониторинга времени API запросов
export const useApiPerformanceMonitor = () => {
  const measureApiTime = async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await apiCall()
      const responseTime = Date.now() - startTime
      
      // Логируем медленные запросы (>2 секунд)
      if (responseTime > 2000 && process.env.NODE_ENV === 'development') {
        console.warn(`[API Performance] Slow API call: ${apiName} took ${responseTime}ms`)
      }
      
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error(`[API Performance] Failed API call: ${apiName} took ${responseTime}ms`, error)
      throw error
    }
  }
  
  return { measureApiTime }
}

// Хук для оптимизации на основе производительности устройства
export const useDeviceOptimization = () => {
  const [optimizations, setOptimizations] = useState({
    shouldReduceAnimations: false,
    shouldLimitConcurrentRequests: false,
    shouldUseSimplifiedUI: false,
    maxCacheSize: 50 // MB
  })
  
  useEffect(() => {
    const isSlowDevice = detectSlowDevice()
    
    if (isSlowDevice) {
      setOptimizations({
        shouldReduceAnimations: true,
        shouldLimitConcurrentRequests: true,
        shouldUseSimplifiedUI: true,
        maxCacheSize: 25 // Меньший кэш для слабых устройств
      })
      
      // Добавляем CSS класс для редуцированных анимаций
      document.documentElement.classList.add('reduce-animations')
    }
  }, [])
  
  return optimizations
}

// Хук для мониторинга FPS и плавности
export const useFpsMonitor = () => {
  const [fps, setFps] = useState<number>(60)
  const frameCountRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(Date.now())
  
  useEffect(() => {
    let animationId: number
    
    const measureFps = () => {
      frameCountRef.current++
      const now = Date.now()
      
      // Обновляем FPS каждые 1000ms
      if (now - lastTimeRef.current >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
        setFps(currentFps)
        
        // Предупреждаем о низком FPS
        if (currentFps < 30 && process.env.NODE_ENV === 'development') {
          console.warn(`[FPS Monitor] Low FPS detected: ${currentFps}`)
        }
        
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      
      animationId = requestAnimationFrame(measureFps)
    }
    
    animationId = requestAnimationFrame(measureFps)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])
  
  return fps
}

// Утилита для отложенного выполнения тяжелых операций
export const useIdleCallback = (callback: () => void, timeout: number = 5000) => {
  useEffect(() => {
    const executeCallback = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout })
      } else {
        // Fallback для браузеров без поддержки requestIdleCallback
        setTimeout(callback, 100)
      }
    }
    
    executeCallback()
  }, [callback, timeout])
}

// Хук для адаптивной загрузки изображений
export const useAdaptiveImageLoading = () => {
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low'>('high')
  
  useEffect(() => {
    const isSlowDevice = detectSlowDevice()
    const connection = (navigator as any).connection
    
    if (isSlowDevice || (connection && connection.effectiveType === 'slow-2g')) {
      setImageQuality('low')
    } else if (connection && connection.effectiveType === '2g') {
      setImageQuality('medium')
    }
  }, [])
  
  const getImageSrc = (basePath: string): string => {
    const qualityMap = {
      high: '',
      medium: '_medium',
      low: '_low'
    }
    
    const quality = qualityMap[imageQuality]
    const extension = basePath.split('.').pop()
    const pathWithoutExt = basePath.slice(0, basePath.lastIndexOf('.'))
    
    return `${pathWithoutExt}${quality}.${extension}`
  }
  
  return { imageQuality, getImageSrc }
}

// Export hook for external component usage
export const usePerformanceIndicatorData = () => {
  const metrics = usePerformanceMonitor('PerformanceIndicator')
  const fps = useFpsMonitor()
  
  return {
    fps,
    memoryUsage: metrics.memoryUsage,
    isSlowDevice: metrics.isSlowDevice
  }
}
