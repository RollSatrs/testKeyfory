export function ServiceCard({ service, onOrder }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      transform: 'translateY(0)',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)'
      e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.3)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)'
    }}
    >
      {/* Декоративный градиент сверху */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }} />

      <div style={{ padding: '24px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '12px',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          {service.title || service.name}
        </h3>

        <p style={{
          color: '#E0E0E0',
          marginBottom: '20px',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          {service.description || 'Премиум цифровая услуга'}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {service.basePrice || service.price} ₽
            </div>
            <div style={{
              fontSize: '12px',
              color: '#B0BEC5',
              marginTop: '4px'
            }}>
              💎 {service.keysRequired || service.required_keys || 1} ключ
            </div>
          </div>
        </div>

        <button
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: '700',
            padding: '14px 24px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            transform: 'translateY(0)'
          }}
          onClick={onOrder}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)'
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateY(0) scale(0.98)'
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1)'
          }}
        >
          🛒 Заказать
        </button>
      </div>
    </div>
  )
}
