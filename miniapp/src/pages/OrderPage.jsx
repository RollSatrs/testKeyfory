import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export function OrderPage({ user }) {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    description: '',
    contactInfo: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/services/get`)
      const data = await response.json()
      const foundService = data.find(s => s.id === parseInt(serviceId))
      setService(foundService)
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Необходимо авторизоваться')
      return
    }

    setSubmitting(true)
    try {
      const orderData = {
        service_id: service.id,
        customer_telegram_id: user.id.toString(),
        description: formData.description,
        contact_info: formData.contactInfo,
        amount: service.price,
        status: 'PENDING'
      }

      const response = await fetch('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        // Успешное создание заказа
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
          window.Telegram.WebApp.showAlert('Заказ успешно создан!', () => {
            navigate('/')
          })
        } else {
          alert('Заказ успешно создан!')
          navigate('/')
        }
      } else {
        throw new Error('Ошибка при создании заказа')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error')
        window.Telegram.WebApp.showAlert('Ошибка при создании заказа')
      } else {
        alert('Ошибка при создании заказа')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
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
          <div style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Загружаем информацию о услуге...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    )
  }

  if (!service) {
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
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>😕</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            Услуга не найдена
          </h2>
          <p style={{
            color: '#B0BEC5',
            marginBottom: '32px',
            fontSize: '16px',
            maxWidth: '300px'
          }}>
            Возможно, услуга была удалена или изменена
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)'
            }}
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    )
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
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔒</div>
          <h3 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            Необходима авторизация
          </h3>
          <p style={{
            color: '#B0BEC5',
            fontSize: '16px',
            maxWidth: '300px'
          }}>
            Для оформления заказа необходимо авторизоваться через Telegram
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
      {/* Header с информацией об услуге */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Декоративный градиент */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
        }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#B0BEC5',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              marginBottom: '20px',
              padding: '8px 0',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = '#B0BEC5'}
          >
            ← Назад к услугам
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              {service.name}
            </h1>
            <p style={{
              color: '#E0E0E0',
              fontSize: '16px',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: '1.5'
            }}>
              {service.description}
            </p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ padding: '24px' }}>
        {/* Карточка с ценой */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '24px',
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
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
            borderRadius: '24px'
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              {service.price} ₽
            </div>
            <div style={{
              color: '#B0BEC5',
              fontSize: '14px'
            }}>
              Стоимость услуги
            </div>
          </div>
        </div>

        {/* Форма заказа */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '600px',
          margin: '0 auto',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '24px',
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            Оформление заказа
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                fontWeight: '600',
                marginBottom: '8px',
                fontSize: '16px'
              }}>
                Описание заказа *
              </label>
              <textarea
                name="description"
                rows="4"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '16px',
                  color: 'white',
                  fontSize: '16px',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                placeholder="Опишите детали вашего заказа..."
                value={formData.description}
                onChange={handleInputChange}
                required
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(102, 126, 234, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                fontWeight: '600',
                marginBottom: '8px',
                fontSize: '16px'
              }}>
                Контактная информация
              </label>
              <input
                type="text"
                name="contactInfo"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '16px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                placeholder="Email, телефон или другие контакты"
                value={formData.contactInfo}
                onChange={handleInputChange}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(102, 126, 234, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.description.trim()}
              style={{
                width: '100%',
                background: submitting || !formData.description.trim()
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: '700',
                padding: '18px',
                borderRadius: '16px',
                border: 'none',
                cursor: submitting || !formData.description.trim() ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                boxShadow: submitting || !formData.description.trim()
                  ? 'none'
                  : '0 15px 35px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                opacity: submitting || !formData.description.trim() ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!submitting && formData.description.trim()) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 20px 45px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && formData.description.trim()) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }} />
                  Создание заказа...
                </span>
              ) : (
                <>🛒 Оформить заказ за {service.price} ₽</>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          ::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
        `}
      </style>
    </div>
  )
}
