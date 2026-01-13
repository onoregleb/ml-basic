'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Sliders } from 'lucide-react'
import { OptimizedPlot } from './BundleOptimization'

interface OverfittingResponse {
  degrees: number[]
  train_mse: number[]
  val_mse: number[]
  x_train: number[]
  y_train: number[]
  x_val: number[]
  y_val: number[]
  x_curve: number[]
  y_true_curve: number[]
  y_pred_curve: number[]
  selected_degree: number
}

export default function OverfittingSimulator() {
  const [data, setData] = useState<OverfittingResponse | null>(null)
  const [maxDegree, setMaxDegree] = useState(12)
  const [selectedDegree, setSelectedDegree] = useState(6)
  const [alpha, setAlpha] = useState(0)
  const [noise, setNoise] = useState(0.3)
  const [loading, setLoading] = useState(false)

  const requestBody = useMemo(
    () => ({
      n_samples: 120,
      noise,
      max_degree: maxDegree,
      alpha,
      selected_degree: selectedDegree,
      test_size: 0.3,
      random_state: 42,
    }),
    [alpha, maxDegree, noise, selectedDegree]
  )

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        const resp = await fetch('http://localhost:8000/api/ml/overfitting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (!resp.ok) throw new Error('Не удалось загрузить данные симулятора')
        const json = (await resp.json()) as OverfittingResponse
        if (!cancelled) setData(json)
      } catch (e) {
        console.error(e)
        toast.error('Ошибка загрузки симулятора переобучения')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [requestBody])

  const canRender = !!data && !loading

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Симулятор переобучения</h2>
        <p className="text-gray-600">
          Чем сложнее модель, тем ниже ошибка на обучении — но ошибка на валидации может начать расти.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sliders className="h-5 w-5 mr-2" />
            Параметры
          </h3>
          {loading && <span className="text-sm text-gray-500">Пересчет…</span>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Макс. сложность (degree)</label>
            <input
              type="range"
              min={4}
              max={20}
              step={1}
              value={maxDegree}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                setMaxDegree(v)
                setSelectedDegree((prev) => Math.min(prev, v))
              }}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{maxDegree}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Выбранная сложность</label>
            <input
              type="range"
              min={1}
              max={maxDegree}
              step={1}
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{selectedDegree}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Шум в данных</label>
            <input
              type="range"
              min={0}
              max={1.2}
              step={0.05}
              value={noise}
              onChange={(e) => setNoise(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{noise.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Регуляризация (Ridge α)</label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{alpha.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ошибка на train/validation</h3>
        <div className="h-80">
          <OptimizedPlot
            data={
              canRender
                ? [
                    {
                      x: data!.degrees,
                      y: data!.train_mse,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Train MSE',
                      line: { color: 'rgb(59, 130, 246)' },
                    },
                    {
                      x: data!.degrees,
                      y: data!.val_mse,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Validation MSE',
                      line: { color: 'rgb(239, 68, 68)' },
                    },
                    {
                      x: [data!.selected_degree, data!.selected_degree],
                      y: [Math.min(...data!.train_mse, ...data!.val_mse), Math.max(...data!.train_mse, ...data!.val_mse)],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Выбрано',
                      line: { color: 'rgba(17, 24, 39, 0.5)', dash: 'dash' },
                      hoverinfo: 'skip',
                      showlegend: false,
                    },
                  ]
                : []
            }
            layout={{
              xaxis: { title: 'Сложность модели (degree)' },
              yaxis: { title: 'MSE (чем меньше — тем лучше)' },
              hovermode: 'closest',
              legend: { orientation: 'h', y: -0.25 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              margin: { l: 50, r: 20, b: 60, t: 20 },
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Подсказка: если Validation MSE растёт при увеличении сложности — это признак переобучения.
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Визуализация предсказаний</h3>
        <div className="h-96">
          <OptimizedPlot
            data={
              canRender
                ? [
                    {
                      x: data!.x_train,
                      y: data!.y_train,
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Train',
                      marker: { color: 'rgba(59, 130, 246, 0.8)', size: 6 },
                    },
                    {
                      x: data!.x_val,
                      y: data!.y_val,
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Validation',
                      marker: { color: 'rgba(239, 68, 68, 0.8)', size: 6, symbol: 'diamond' },
                    },
                    {
                      x: data!.x_curve,
                      y: data!.y_true_curve,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Истинная зависимость',
                      line: { color: 'rgba(17, 24, 39, 0.5)', width: 2 },
                    },
                    {
                      x: data!.x_curve,
                      y: data!.y_pred_curve,
                      type: 'scatter',
                      mode: 'lines',
                      name: `Модель degree=${data!.selected_degree}`,
                      line: { color: 'rgb(16, 185, 129)', width: 3 },
                    },
                  ]
                : []
            }
            layout={{
              xaxis: { title: 'x' },
              yaxis: { title: 'y' },
              hovermode: 'closest',
              legend: { orientation: 'h', y: -0.25 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              margin: { l: 50, r: 20, b: 60, t: 20 },
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

