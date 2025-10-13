'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// Простой in-memory кэш для API запросов
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 минут по умолчанию
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  invalidate(keyPattern?: string) {
    if (!keyPattern) {
      this.cache.clear()
      return
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }
}

const apiCache = new ApiCache()

interface UseOptimizedApiOptions {
  cache?: boolean
  cacheTTL?: number
  retry?: number
  retryDelay?: number
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

// Дебаунс для избежания дублирующих запросов
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Основной хук для оптимизированных API вызовов
export function useOptimizedApi<T>(
  url: string | null,
  options: UseOptimizedApiOptions = {}
): ApiState<T> {
  const {
    cache = true,
    cacheTTL = 5 * 60 * 1000,
    retry = 2,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = useMemo(() => url ? `api_${url}` : null, [url])

  const fetchData = useCallback(async (retryCount = 0) => {
    if (!url || !cacheKey) return

    // Проверяем кэш
    if (cache) {
      const cachedData = apiCache.get(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        setError(null)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Кэшируем результат
      if (cache) {
        apiCache.set(cacheKey, result, cacheTTL)
      }

      setData(result)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      
      // Ретрай логика
      if (retryCount < retry) {
        setTimeout(() => {
          fetchData(retryCount + 1)
        }, retryDelay * (retryCount + 1))
        return
      }
      
      setError(errorMessage)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [url, cacheKey, cache, cacheTTL, retry, retryDelay])

  const refetch = useCallback(() => {
    if (cacheKey) {
      apiCache.invalidate(cacheKey)
    }
    fetchData()
  }, [fetchData, cacheKey])

  useEffect(() => {
    if (url) {
      fetchData()
    }
  }, [fetchData, url])

  return { data, loading, error, refetch }
}

// Специализированные хуки для разных типов данных

export function useLessonData(lessonId: number | null) {
  const url = lessonId ? `http://localhost:8000/api/lessons/${lessonId}` : null
  return useOptimizedApi(url, { cache: true, cacheTTL: 10 * 60 * 1000 }) // 10 минут кэш для урока
}

export function useProgressData(lessonId: number | null) {
  const url = lessonId ? `http://localhost:8000/api/lessons/${lessonId}/progress` : null
  return useOptimizedApi(url, { cache: false }) // Прогресс не кэшируем
}

export function useAllLessons() {
  return useOptimizedApi('http://localhost:8000/api/lessons', { 
    cache: true, 
    cacheTTL: 15 * 60 * 1000 // 15 минут кэш для списка уроков
  })
}

// Хук для обновления прогресса с оптимизацией
export function useUpdateProgress() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProgress = useCallback(async (
    lessonId: number,
    status: string,
    score: number = 0
  ) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const url = `http://localhost:8000/api/lessons/${lessonId}/progress?status=${status}&score=${score}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить прогресс')
      }

      const result = await response.json()
      
      // Инвалидируем кэш прогресса
      apiCache.invalidate('progress')
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления прогресса'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateProgress, loading, error }
}

// Утилита для предварительной загрузки данных
export function prefetchData(urls: string[], options: UseOptimizedApiOptions = {}) {
  const { cacheTTL = 5 * 60 * 1000 } = options
  
  return Promise.all(
    urls.map(async (url) => {
      const cacheKey = `api_${url}`
      
      // Проверяем, есть ли уже в кэше
      if (apiCache.get(cacheKey)) {
        return Promise.resolve()
      }
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(url, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          apiCache.set(cacheKey, data, cacheTTL)
        }
      } catch (err) {
        // Игнорируем ошибки при предварительной загрузке
        console.warn('Prefetch failed for', url, err)
      }
    })
  )
}
