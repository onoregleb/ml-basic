'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Download, Loader2, Upload, XCircle } from 'lucide-react'

type RegressionProjectCheckResponse = {
  ok: boolean
  passed: boolean
  score: number
  metrics?: { r2: number; rmse: number; n_test: number; n_pred: number } | null
  llm?: {
    ok: boolean
    result?: { summary: string; strengths: string[]; improvements: string[] } | null
    model_text?: string | null
    error?: string | null
  } | null
  error?: string | null
}

function downloadBlob(filename: string, contentType: string, data: BlobPart) {
  const blob = new Blob([data], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ProjectSubmissionChecker({ lessonId }: { lessonId: number }) {
  const [predFile, setPredFile] = useState<File | null>(null)
  const [codeFile, setCodeFile] = useState<File | null>(null)
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<RegressionProjectCheckResponse | null>(null)

  const canSubmit = useMemo(() => !!predFile && !loading, [predFile, loading])

  async function handleDownload(split: 'train' | 'test') {
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`/api/lessons/${lessonId}/project/dataset/${split}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!resp.ok) throw new Error('Не удалось скачать датасет')
      const text = await resp.text()
      downloadBlob(`project_${split}.csv`, 'text/csv;charset=utf-8', text)
    } catch (e) {
      console.error(e)
      toast.error('Ошибка скачивания данных')
    }
  }

  async function handleCheck() {
    if (loading) return
    if (!predFile) {
      toast.error('Загрузите predictions.csv')
      return
    }

    try {
      setLoading(true)
      setResponse(null)

      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('predictions', predFile)
      if (codeFile) form.append('code', codeFile)
      if (reportText.trim()) form.append('report_text', reportText.trim())

      const resp = await fetch(`/api/lessons/${lessonId}/project/check-upload`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: form,
      })

      const json = (await resp.json()) as RegressionProjectCheckResponse
      setResponse(json)

      if (!resp.ok || !json.ok) {
        toast.error(json.error || 'Не удалось проверить проект')
        return
      }

      if (json.passed) {
        toast.success('Проект принят по метрикам! Прогресс обновлён.')
      } else {
        toast('Пока не принят: улучшите качество и отправьте снова.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Ошибка при проверке проекта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Сдача проекта: регрессия (файлами)</h2>
          <p className="text-sm text-gray-600">
            Скачайте данные, обучите модель, загрузите <span className="font-medium">predictions.csv</span> (id, y_pred) и
            опционально код/отчёт — мы посчитаем метрики и дадим рекомендации через LLM.
          </p>
        </div>
        {response?.ok && (
          <div className="flex items-center gap-2">
            {response.passed ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Принято</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Нужно улучшить</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => handleDownload('train')} className="btn-secondary inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          Скачать train.csv
        </button>
        <button onClick={() => handleDownload('test')} className="btn-secondary inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          Скачать test.csv
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">predictions.csv (обязательно)</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setPredFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Колонки: id, y_pred</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Файл с кодом (опционально)</label>
          <input
            type="file"
            accept=".py,.ipynb,.txt,.md,text/plain"
            onChange={(e) => setCodeFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Например: solution.py или notebook.ipynb</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Краткий отчёт (опционально)</label>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Коротко: как обрабатывали пропуски, какие признаки/модель, как валидировали, что улучшить дальше..."
          className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex items-center justify-end mt-3">
        <button onClick={handleCheck} disabled={!canSubmit} className="btn-primary inline-flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Проверить
        </button>
      </div>

      {response && (
        <div className="mt-5 space-y-4">
          {!response.ok && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{response.error || 'Ошибка проверки'}</div>
          )}

          {response.ok && response.metrics && (
            <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-800">
              <div className="font-medium text-gray-900 mb-1">Метрики</div>
              <div>R²: {response.metrics.r2.toFixed(4)}</div>
              <div>RMSE: {response.metrics.rmse.toFixed(4)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Предсказаний: {response.metrics.n_pred}, тестовых строк: {response.metrics.n_test}
              </div>
            </div>
          )}

          {response.ok && response.llm && !response.llm.ok && (
            <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
              LLM недоступна: {response.llm.error || 'ошибка'}
            </div>
          )}

          {response.ok && response.llm?.ok && response.llm.result && (
            <>
              <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-800">
                <span className="font-medium text-gray-900">Рекомендации:</span> {response.llm.result.summary}
              </div>

              {!!response.llm.result.strengths?.length && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Сильные стороны</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {response.llm.result.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!!response.llm.result.improvements?.length && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Что улучшить</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {response.llm.result.improvements.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {response.ok && response.llm?.ok && !response.llm.result && response.llm.model_text && (
            <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap">
              {response.llm.model_text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

