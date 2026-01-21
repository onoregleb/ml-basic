'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Award, RefreshCw, HelpCircle } from 'lucide-react'

interface QuizQuestion {
  id: number
  question_text: string
  question_type: string
  options: string[] | null
  points: number
}

interface QuizAnswerResult {
  question_id: number
  is_correct: boolean
  correct_answer: string
  user_answer: string
}

interface QuizResult {
  total_questions: number
  correct_answers: number
  score: number
  passed: boolean
  results: QuizAnswerResult[]
}

interface QuizProps {
  lessonId: number
}

const Quiz: React.FC<QuizProps> = ({ lessonId }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/lessons/${lessonId}/quiz`)
      if (!response.ok) {
        throw new Error('Не удалось загрузить вопросы')
      }
      const data = await response.json()
      setQuestions(data)
      setAnswers({})
      setResult(null)
      setShowResults(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`Пожалуйста, ответьте на все вопросы. Осталось: ${unanswered.length}`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Для прохождения квиза необходимо войти в систему')
        setSubmitting(false)
        return
      }

      const payload = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: parseInt(questionId),
          answer
        }))
      }

      const response = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || 'Не удалось отправить ответы')
      }

      const data = await response.json()
      setResult(data)
      setShowResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setResult(null)
    setShowResults(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center mb-4">
          <HelpCircle className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Проверка знаний</h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка вопросов...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <HelpCircle className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Проверка знаний</h2>
        </div>
        {showResults && (
          <button
            onClick={handleRetry}
            className="flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Пройти снова
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {showResults && result ? (
        <div className="space-y-6">
          {/* Результат */}
          <div className={`p-6 rounded-lg ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center justify-center mb-4">
              {result.passed ? (
                <Award className="h-12 w-12 text-green-500" />
              ) : (
                <RefreshCw className="h-12 w-12 text-yellow-500" />
              )}
            </div>
            <div className="text-center">
              <h3 className={`text-xl font-bold ${result.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                {result.passed ? 'Отлично!' : 'Попробуйте еще раз'}
              </h3>
              <p className="text-gray-600 mt-2">
                Правильных ответов: {result.correct_answers} из {result.total_questions}
              </p>
              <div className="mt-3">
                <span className={`text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                  {Math.round(result.score)}%
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {result.passed ? 'Урок засчитан!' : 'Для прохождения нужно набрать 70%'}
              </p>
            </div>
          </div>

          {/* Детальные результаты */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Детальные результаты:</h4>
            {questions.map((question, index) => {
              const questionResult = result.results.find(r => r.question_id === question.id)
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border ${
                    questionResult?.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    <span className="flex-shrink-0 mr-3">
                      {questionResult?.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {index + 1}. {question.question_text}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Ваш ответ: <span className={questionResult?.is_correct ? 'text-green-600' : 'text-red-600'}>
                          {questionResult?.user_answer || '—'}
                        </span>
                      </p>
                      {!questionResult?.is_correct && (
                        <p className="text-sm text-green-600 mt-1">
                          Правильный ответ: {questionResult?.correct_answer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800 mb-3">
                {index + 1}. {question.question_text}
              </p>
              {question.question_type === 'multiple_choice' && question.options ? (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        answers[question.id] === option
                          ? 'bg-primary-50 border-primary-300'
                          : 'bg-white border-gray-200 hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Введите ваш ответ..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Проверка...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Проверить ответы
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz
