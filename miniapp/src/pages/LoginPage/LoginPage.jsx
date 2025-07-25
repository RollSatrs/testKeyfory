import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import AuthForm from './components/AuthForm';
import AuthLayout from './components/AuthLayout';

const LoginPage = ({ onLogin }) => {
  const [telegramId, setTelegramId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Автозаполнение Telegram ID если доступно
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        setTelegramId(tg.initDataUnsafe.user.id.toString());
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!telegramId.trim()) {
      setError('Введите Telegram ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/executers/get', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || 'admin_token'}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка соединения с сервером');
      }

      const executers = await response.json();
      const executer = executers.find(e =>
        e.telegram_id === telegramId ||
        e.telegram_id === `@${telegramId}` ||
        e.telegram_id === telegramId.toString()
      );

      if (executer) {
        onLogin(executer);

        // Уведомление об успешном входе
        if (window.Telegram && window.Telegram.WebApp) {
          window.Telegram.WebApp.showAlert('Добро пожаловать!');
        }
      } else {
        setError('Доступ запрещен. Ваш Telegram ID не найден в системе исполнителей.');
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      setError('Ошибка соединения с сервером. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-tg-button rounded-full flex items-center justify-center mb-4">
          <Key className="w-8 h-8 text-tg-button-text" />
        </div>
        <h1 className="text-2xl font-bold text-tg-text mb-2">Авторизация</h1>
        <p className="text-tg-hint text-center">
          Введите ваш Telegram ID для входа в систему исполнителя
        </p>
      </div>

      <AuthForm
        telegramId={telegramId}
        setTelegramId={setTelegramId}
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    </AuthLayout>
  );
};

export default LoginPage;
