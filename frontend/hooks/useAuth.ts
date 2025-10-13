import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Пытаемся получить детали ошибки от сервера
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail?.error || 
                            errorData?.detail || 
                            errorData?.message || 
                            errorData?.error || 
                            `Ошибка ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // FastAPI OAuth2 возвращает access_token
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        
        // Получаем данные текущего пользователя
        try {
          const userResponse = await fetch('http://localhost:8000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (userErr) {
          console.warn('Could not fetch user data:', userErr);
          // Сохраняем базовую информацию
          localStorage.setItem('user', JSON.stringify({ email }));
        }
        
        // Успешный вход! Теперь перенаправляем в личный кабинет.
        router.push('/dashboard');
      } else {
        throw new Error('Токен не был получен');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  // Дополнительная функция для выхода
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Функция для проверки авторизации
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  };

  // Функция для получения данных пользователя
  const getUser = () => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  return { login, logout, isAuthenticated, getUser, error, isLoading };
}