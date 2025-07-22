import { useState, useEffect } from 'react'
import { ServiceCard } from '../components/ServiceCard'
import { CategoryFilter } from '../components/CategoryFilter'
import { PageHeader } from '../components/PageHeader'

export function ServicesPage({ user }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/services/get')
      const data = await response.json()
      setServices(data.filter(service => service.status === 'ACTIVE'))
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: 'all', name: 'Все услуги', icon: '🌟' },
    { id: 'streaming', name: 'Стриминг', icon: '📺' },
    { id: 'gaming', name: 'Игры', icon: '🎮' },
    { id: 'software', name: 'ПО', icon: '💻' },
    { id: 'social', name: 'Соцсети', icon: '📱' },
  ]

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(service => service.category === selectedCategory)

  const handleOrder = (serviceId) => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.HapticFeedback.impactOccurred('medium')
    }
    window.location.href = `/order/${serviceId}`
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
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            ✨ Загрузка услуг...
          </div>
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      paddingBottom: '100px'
    }}>
      <PageHeader
        title="Цифровые Услуги"
        subtitle="Выберите нужную услугу из нашего каталога"
        user={user}
      />

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {filteredServices.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          padding: '0 20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onOrder={() => handleOrder(service.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          margin: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🔍</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            Услуги не найдены
          </h3>
          <p style={{
            color: '#B0BEC5',
            fontSize: '16px',
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            В выбранной категории пока нет доступных услуг. Попробуйте выбрать другую категорию.
          </p>
        </div>
      )}
    </div>
  )
}
