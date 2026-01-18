'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Sliders } from 'lucide-react'
import { OptimizedPlot } from './BundleOptimization'

interface ClusterProfile {
  cluster: number
  size: number
  avg_age: number
  avg_total_spent: number
  avg_frequency: number
  avg_recency: number
}

interface CustomerSegmentationResponse {
  points_2d: number[][]
  labels: number[]
  centroids_2d: number[][]
  profiles: ClusterProfile[]
}

export default function CustomerSegmentationSimulator() {
  const [data, setData] = useState<CustomerSegmentationResponse | null>(null)
  const [nCustomers, setNCustomers] = useState(300)
  const [nClusters, setNClusters] = useState(4)
  const [noise, setNoise] = useState(0.25)
  const [loading, setLoading] = useState(false)

  const requestBody = useMemo(
    () => ({
      n_customers: nCustomers,
      n_clusters: nClusters,
      noise,
      random_state: 42,
    }),
    [nClusters, nCustomers, noise]
  )

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        const resp = await fetch('/api/ml/customer-segmentation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(requestBody),
        })
        if (!resp.ok) throw new Error('Не удалось загрузить данные мини-проекта')
        const json = (await resp.json()) as CustomerSegmentationResponse
        if (!cancelled) setData(json)
      } catch (e) {
        console.error(e)
        toast.error('Ошибка загрузки мини-проекта')
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Мини‑проект: сегментация клиентов</h2>
        <p className="text-gray-600">
          Генерируем синтетические данные клиентов, кластеризуем и смотрим профили сегментов.
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

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Количество клиентов</label>
            <input
              type="range"
              min={100}
              max={1200}
              step={50}
              value={nCustomers}
              onChange={(e) => setNCustomers(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{nCustomers}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Количество кластеров (K)</label>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={nClusters}
              onChange={(e) => setNClusters(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{nClusters}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Шум</label>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={noise}
              onChange={(e) => setNoise(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{noise.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Кластеры (PCA 2D)</h3>
        <div className="h-96">
          <OptimizedPlot
            data={
              canRender
                ? [
                    {
                      x: data!.points_2d.map((p) => p[0]),
                      y: data!.points_2d.map((p) => p[1]),
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Клиенты',
                      marker: {
                        size: 6,
                        color: data!.labels,
                        colorscale: 'Viridis',
                        opacity: 0.75,
                      },
                    },
                    {
                      x: data!.centroids_2d.map((p) => p[0]),
                      y: data!.centroids_2d.map((p) => p[1]),
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Центроиды',
                      marker: { size: 12, color: 'rgba(239, 68, 68, 0.95)', symbol: 'x' },
                    },
                  ]
                : []
            }
            layout={{
              xaxis: { title: 'PC1' },
              yaxis: { title: 'PC2' },
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

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Профили сегментов</h3>
        {!data?.profiles?.length ? (
          <p className="text-gray-600">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Кластер</th>
                  <th className="py-2 pr-4">Размер</th>
                  <th className="py-2 pr-4">Возраст</th>
                  <th className="py-2 pr-4">Траты</th>
                  <th className="py-2 pr-4">Частота</th>
                  <th className="py-2 pr-4">Давность</th>
                </tr>
              </thead>
              <tbody>
                {data.profiles.map((p) => (
                  <tr key={p.cluster} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">{p.cluster}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.size}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.avg_age.toFixed(1)}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.avg_total_spent.toFixed(0)}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.avg_frequency.toFixed(1)}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.avg_recency.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Важно: это синтетические данные — цель симулятора показать процесс сегментации и интерпретации.
        </p>
      </div>
    </div>
  )
}

