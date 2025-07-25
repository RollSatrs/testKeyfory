import { useState, useEffect } from 'react'

export const ProfilePage = ({ executer, onLogout }) => {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    totalEarnings: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExecuterData()
  }, [executer])

  const loadExecuterData = async () => {
    if (!executer) return

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3000/api/orders/executer/${executer.id}`, {
        headers: {
          'Authorization': 'Bearer admin_token'
        }
      })

      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
        calculateStats(ordersData)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (ordersData) => {
    const stats = {
      total: ordersData.length,
      completed: ordersData.filter(o => o.status === 'completed').length,
      inProgress: ordersData.filter(o => o.status === 'in_progress').length,
      totalEarnings: ordersData
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (order.total_sum || 0), 0)
    }
    setStats(stats)
  }

  const getCompletionRate = () => {
    if (stats.total === 0) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }

  const getRecentOrders = () => {
    return orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--tg-theme-bg-color, #ffffff)'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--tg-theme-hint-color, #999999)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Загрузка профиля...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px 20px 100px 20px',
      background: 'var(--tg-theme-bg-color, #ffffff)'
    }}>
      {/* Заголовок */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--tg-theme-text-color, #000000)'
        }}>
          👤 Профиль
        </h1>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 15px',
            fontSize: '12px',
            background: 'rgba(255, 68, 68, 0.1)',
            color: '#ff4444',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>

      {/* Информация об исполнителе */}
      <div style={{
        background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '25px',
        textAlign: 'center',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'var(--tg-theme-button-color, #0088cc)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 15px auto',
          fontSize: '32px',
          color: 'white'
        }}>
          👤
        </div>

        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--tg-theme-text-color, #000000)',
          marginBottom: '8px'
        }}>
          {executer.name || 'Исполнитель'}
        </h2>

        <div style={{
          fontSize: '14px',
          color: 'var(--tg-theme-hint-color, #999999)',
          marginBottom: '15px'
        }}>
          Telegram ID: {executer.telegram_id}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--tg-theme-text-color, #000000)'
            }}>
              {executer.rating || '0'}
            </span>
          </div>
          <div style={{
            padding: '4px 8px',
            background: getCompletionRate() >= 80 ? '#28a745' :
                       getCompletionRate() >= 60 ? '#ffc107' : '#6c757d',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {getCompletionRate()}% завершено
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--tg-theme-button-color, #0088cc)',
            marginBottom: '5px'
          }}>
            {stats.total}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--tg-theme-hint-color, #999999)'
          }}>
            Всего заказов
          </div>
        </div>

        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#28a745',
            marginBottom: '5px'
          }}>
            {stats.completed}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--tg-theme-hint-color, #999999)'
          }}>
            Выполнено
          </div>
        </div>

        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#17a2b8',
            marginBottom: '5px'
          }}>
            {stats.inProgress}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--tg-theme-hint-color, #999999)'
          }}>
            В работе
          </div>
        </div>

        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#28a745',
            marginBottom: '5px'
          }}>
            {stats.totalEarnings.toLocaleString()} ₽
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--tg-theme-hint-color, #999999)'
          }}>
            Заработано
          </div>
        </div>
      </div>

      {/* Последние заказы */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--tg-theme-text-color, #000000)',
          marginBottom: '15px'
        }}>
          📋 Последние заказы
        </h2>

        {getRecentOrders().length === 0 ? (
          <div style={{
            background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'var(--tg-theme-hint-color, #999999)'
          }}>
            Заказы не найдены
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {getRecentOrders().map(order => (
              <div
                key={order.id}
                style={{
                  background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--tg-theme-text-color, #000000)'
                  }}>
                    Заказ #{order.id}
                  </span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    background: order.status === 'completed' ? '#28a745' :
                              order.status === 'in_progress' ? '#17a2b8' :
                              order.status === 'pending' ? '#ffc107' : '#6c757d',
                    color: 'white'
                  }}>
                    {order.status === 'completed' ? 'Выполнен' :
                     order.status === 'in_progress' ? 'В работе' :
                     order.status === 'pending' ? 'Ожидает' : order.status}
                  </span>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--tg-theme-hint-color, #999999)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{order.Service?.name || 'Услуга не указана'}</span>
                  <span>{order.total_sum || 0} ₽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Информация о статусе */}
      <div style={{
        background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--tg-theme-text-color, #000000)',
          marginBottom: '10px'
        }}>
          ℹ️ Информация о статусе
        </h3>
        <div style={{
          fontSize: '14px',
          color: 'var(--tg-theme-text-color, #000000)',
          lineHeight: '1.5'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Статус аккаунта:</strong> {executer.status || 'Активный'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Дата регистрации:</strong> {new Date(executer.create_date_executer).toLocaleDateString('ru-RU')}
          </div>
          <div>
            <strong>Эффективность:</strong> {getCompletionRate()}% заказов завершено успешно
          </div>
        </div>
      </div>
    </div>
  )
}
      'CANCELLED': 'Отменен'
    }
    return statusMap[status] || status
  }

  const getStatusStyle = (status) => {
    const styleMap = {
      'PENDING': {
        background: 'linear-gradient(135deg, #FFF3CD 0%, #FFE69C 100%)',
        color: '#664D03',
        border: '1px solid #FFDF7E'
      },
      'PROCESSING': {
        background: 'linear-gradient(135deg, #CCE5FF 0%, #99D6FF 100%)',
        color: '#003D6B',
        border: '1px solid #7CC7FF'
      },
      'COMPLETED': {
        background: 'linear-gradient(135deg, #D1F2EB 0%, #A3E4D7 100%)',
        color: '#0F5132',
        border: '1px solid #75E6B3'
      },
      'CANCELLED': {
        background: 'linear-gradient(135deg, #F8D7DA 0%, #F5C6CB 100%)',
        color: '#721C24',
        border: '1px solid #F1AEB5'
      }
    }
    return styleMap[status] || {
      background: 'linear-gradient(135deg, #E9ECEF 0%, #DEE2E6 100%)',
      color: '#495057',
      border: '1px solid #CED4DA'
    }
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🔒</div>
          <h3 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Необходима авторизация
          </h3>
          <p style={{ color: '#B0BEC5', fontSize: '16px' }}>
            Для доступа к профилю необходимо авторизоваться через Telegram
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      paddingBottom: '100px'
    }}>
      {/* Профиль пользователя */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '32px',
        margin: '20px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Декоративный фон */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: '24px'
        }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '36px',
            fontWeight: 'bold',
            margin: '0 auto 24px auto',
            boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
            border: '3px solid rgba(255, 255, 255, 0.3)'
          }}>
            {user.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            {user.first_name} {user.last_name || ''}
          </h1>

          {user.username && (
            <p style={{
              color: '#B0BEC5',
              marginBottom: '8px',
              fontSize: '16px'
            }}>
              @{user.username}
            </p>
          )}

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '8px 16px',
            display: 'inline-block',
            color: '#90A4AE',
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            ID: {user.id}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '0 20px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px 16px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            borderRadius: '20px'
          }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              {stats.totalOrders}
            </div>
            <div style={{
              color: '#B0BEC5',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Всего заказов
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(76, 175, 80, 0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px 16px',
          textAlign: 'center',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          boxShadow: '0 15px 35px rgba(76, 175, 80, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
            borderRadius: '20px'
          }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#4CAF50',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(76, 175, 80, 0.3)'
            }}>
              {stats.completedOrders}
            </div>
            <div style={{
              color: '#81C784',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Выполнено
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 193, 7, 0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px 16px',
          textAlign: 'center',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          boxShadow: '0 15px 35px rgba(255, 193, 7, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
            borderRadius: '20px'
          }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(255, 193, 7, 0.3)'
            }}>
              {stats.totalSpent}₽
            </div>
            <div style={{
              color: '#FFB74D',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Потрачено
            </div>
          </div>
        </div>
      </div>

      {/* История заказов */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          История заказов
        </h2>
        <p style={{ color: '#B0BEC5', fontSize: '16px' }}>
          Ваши последние покупки
        </p>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }} />
            <p style={{ color: 'white', fontSize: '18px' }}>Загрузка заказов...</p>
          </div>
        </div>
      ) : orders.length > 0 ? (
        <div style={{ padding: '0 20px' }}>
          {orders.map(order => (
            <div key={order.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '24px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Декоративный градиент */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '24px 24px 0 0'
              }} />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                }}>
                  Заказ #{order.id}
                </h3>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  ...getStatusStyle(order.status)
                }}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div style={{
                color: '#E0E0E0',
                marginBottom: '16px',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                {order.service?.name || 'Цифровая услуга'}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: order.product_keys ? '16px' : '0'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {order.amount || order.price}₽
                </div>
                <div style={{
                  color: '#90A4AE',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {new Date(order.create_date_order).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {order.product_keys && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    🔑 Ключи продукта:
                  </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '12px',
                    borderRadius: '12px',
                    color: '#4CAF50',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    wordBreak: 'break-all'
                  }}>
                    {order.product_keys}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          margin: '0 20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>📋</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            Заказов пока нет
          </h3>
          <p style={{
            color: '#B0BEC5',
            fontSize: '16px',
            maxWidth: '300px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Оформите первый заказ в каталоге услуг и он появится здесь
          </p>
        </div>
      )}

      {/* Добавляем стили для анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
