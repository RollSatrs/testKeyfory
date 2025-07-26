import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Dashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Получаем активные заказы исполнителя
      const ordersResponse = await fetch(`http://localhost:3000/api/order/performer/${user.id}`)
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.filter(order => order.status === 'active' || order.status === 'in_progress'))
      }

      // Получаем статистику
      const statsResponse = await fetch(`http://localhost:3000/api/executers/admin/stats/${user.id}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает',
      'active': 'Активный',
      'in_progress': 'В работе',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ffc107',
      'active': '#007bff',
      'in_progress': '#28a745',
      'completed': '#6c757d',
      'cancelled': '#dc3545'
    }
    return colorMap[status] || '#6c757d'
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem 0'
      }}>
        <h1 style={{ margin: 0, color: 'var(--tg-theme-text-color, #000)' }}>
          Главная
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate('/profile')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Профиль
          </button>
          <button
            onClick={onLogout}
            className="btn"
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white'
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Приветствие */}
      <div style={{
        background: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--tg-theme-text-color, #000)' }}>
          Добро пожаловать, {user.name || 'Исполнитель'}!
        </h2>
        <p style={{ margin: 0, color: 'var(--tg-theme-hint-color, #666)' }}>
          Telegram ID: {user.telegramId}
        </p>
      </div>

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
            {stats.activeOrders}
          </div>
          <div style={{ color: 'var(--tg-theme-hint-color, #666)', fontSize: '0.875rem' }}>
            Активные заказы
          </div>
        </div>

        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
            {stats.completedOrders}
          </div>
          <div style={{ color: 'var(--tg-theme-hint-color, #666)', fontSize: '0.875rem' }}>
            Завершено
          </div>
        </div>

        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
            {stats.totalEarnings}₽
          </div>
          <div style={{ color: 'var(--tg-theme-hint-color, #666)', fontSize: '0.875rem' }}>
            Заработано
          </div>
        </div>
      </div>

      {/* Текущие заказы */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, color: 'var(--tg-theme-text-color, #000)' }}>
            Текущие заказы
          </h3>
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            Все заказы
          </button>
        </div>

        {orders.length === 0 ? (
          <div style={{
            background: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'var(--tg-theme-hint-color, #666)'
          }}>
            У вас пока нет активных заказов
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.slice(0, 3).map(order => (
              <div key={order.id} style={{
                background: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--tg-theme-hint-color, #ddd)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--tg-theme-text-color, #000)' }}>
                      Заказ #{order.id}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--tg-theme-hint-color, #666)', fontSize: '0.875rem' }}>
                      {order.description || 'Описание заказа'}
                    </p>
                  </div>
                  <span style={{
                    background: getStatusColor(order.status),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--tg-theme-hint-color, #666)'
                }}>
                  <span>Стоимость: {order.price || 0}₽</span>
                  <span>Создан: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
