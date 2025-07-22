export function PageHeader({ title, subtitle, user }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      padding: '32px',
      margin: '20px',
      textAlign: 'center',
      boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Декоративный градиентный фон */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderRadius: '24px'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          textShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}>
          {title}
        </h1>
        <p style={{
          color: '#E0E0E0',
          fontSize: '18px',
          marginBottom: user ? '24px' : '0',
          lineHeight: '1.5',
          maxWidth: '500px',
          margin: user ? '0 auto 24px auto' : '0 auto'
        }}>
          {subtitle}
        </p>

        {user && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px 24px',
            display: 'inline-block',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)'
              }}>
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  color: '#B0BEC5',
                  fontSize: '12px',
                  margin: '0 0 2px 0'
                }}>
                  👋 Добро пожаловать
                </p>
                <p style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  margin: 0
                }}>
                  {user.first_name} {user.last_name || ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
