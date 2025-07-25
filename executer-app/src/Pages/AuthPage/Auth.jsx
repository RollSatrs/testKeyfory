import { useState } from 'react'

const AuthPage = ({ onLogin }) => {
  const [telegramId, setTelegramId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!telegramId.trim()) {
      setError('Введите Telegram ID')
      setLoading(false)
      return
    }

    if (!/^\d+$/.test(telegramId.trim())) {
      setError('Telegram ID должен содержать только цифры')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/executers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: telegramId.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        onLogin(data.performer)
      } else if (response.status === 404) {
        setError('Пользователь с таким Telegram ID не найден')
      } else {
        setError('Ошибка авторизации. Попробуйте позже')
      }
    } catch (err) {
      console.error('Ошибка авторизации:', err)
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--tg-theme-text-color, #000)' }}>
          Вход исполнителя
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="telegramId" className="form-label">
              Telegram ID
            </label>
            <input
              type="text"
              id="telegramId"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="form-input"
              placeholder="Введите ваш Telegram ID"
              disabled={loading}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--tg-theme-hint-color, #666)' }}>
          Введите ваш Telegram ID для входа в систему
        </div>
      </div>
    </div>
  )
}

export default AuthPage
