'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

type ProjectCheckResponse = {
  ok: boolean
  result?: {
    score: number
    passed: boolean
    summary: string
    strengths: string[]
    improvements: string[]
    rubric: {
      data_and_features: number
      model_choice: number
      k_selection: number
      segment_interpretation: number
      business_recommendations: number
    }
  } | null
  model_text?: string | null
  error?: string | null
}

export default function ProjectSubmissionChecker({ lessonId }: { lessonId: number }) {
  const [submissionText, setSubmissionText] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ProjectCheckResponse | null>(null)

  const minLen = 50
  const trimmedLen = useMemo(() => submissionText.trim().length, [submissionText])
  const canSubmit = useMemo(() => trimmedLen >= minLen && !loading, [trimmedLen, loading])

  async function handleCheck() {
    if (loading) return
    if (trimmedLen < minLen) {
      toast.error(`Слишком короткий ответ: минимум ${minLen} символов`)
      return
    }

    try {
      setLoading(true)
      setResponse(null)

      const token = localStorage.getItem('token')
      const resp = await fetch(`http://localhost:8000/api/lessons/${lessonId}/project/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ submission_text: submissionText }),
      })

      const json = (await resp.json()) as ProjectCheckResponse
      setResponse(json)

      if (!resp.ok || !json.ok) {
        toast.error(json.error || 'Не удалось проверить проект')
        return
      }

      if (json.result?.passed) {
        toast.success('Проект принят! Прогресс обновлён.')
      } else {
        toast('Получен фидбек — доработайте и отправьте снова.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Ошибка при проверке проекта')
    } finally {
      setLoading(false)
    }
  }

  const passed = !!response?.result?.passed

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Сдача проекта (проверка через GigaChat)</h2>
          <p className="text-sm text-gray-600">
            Вставьте отчёт/ответ по заданию (минимум 50 символов) и отправьте на проверку.
          </p>
        </div>
        {response?.ok && response?.result && (
          <div className="flex items-center gap-2">
            {passed ? (
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

      <textarea
        value={submissionText}
        onChange={(e) => setSubmissionText(e.target.value)}
        placeholder={`Пример структуры:\n- Данные и признаки: ...\n- Предобработка: ...\n- Выбор модели и K: ...\n- Интерпретация сегментов: ...\n- Рекомендации и метрики эффекта: ...`}
        className="w-full min-h-[180px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <div className="flex items-center justify-between mt-3 gap-3">
        <span className="text-xs text-gray-500">
          {trimmedLen} / {minLen} символов
        </span>
        <button onClick={handleCheck} disabled={loading} className="btn-primary inline-flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Проверить
        </button>
      </div>

      {response && (
        <div className="mt-5 space-y-4">
          {!response.ok && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {response.error || 'Ошибка проверки'}
            </div>
          )}

          {response.ok && response.result && (
            <>
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Итог:</span> {response.result.summary}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Score: {response.result.score}/100</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Критерий</th>
                      <th className="py-2 pr-4">Баллы</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-gray-700">Данные и признаки</td>
                      <td className="py-2 pr-4 text-gray-900 font-medium">{response.result.rubric.data_and_features}/20</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-gray-700">Выбор модели</td>
                      <td className="py-2 pr-4 text-gray-900 font-medium">{response.result.rubric.model_choice}/20</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-gray-700">Выбор K</td>
                      <td className="py-2 pr-4 text-gray-900 font-medium">{response.result.rubric.k_selection}/20</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-gray-700">Интерпретация сегментов</td>
                      <td className="py-2 pr-4 text-gray-900 font-medium">
                        {response.result.rubric.segment_interpretation}/20
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-gray-700">Бизнес-рекомендации</td>
                      <td className="py-2 pr-4 text-gray-900 font-medium">
                        {response.result.rubric.business_recommendations}/20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!!response.result.strengths?.length && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Сильные стороны</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {response.result.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!!response.result.improvements?.length && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Что улучшить</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {response.result.improvements.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {response.ok && !response.result && response.model_text && (
            <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap">
              {response.model_text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

