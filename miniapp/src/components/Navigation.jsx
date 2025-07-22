import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      icon: '🏠',
      label: 'Главная',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      path: '/orders',
      icon: '📋',
      label: 'Заказы',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Профиль',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '12px 16px',
      zIndex: 50,
      boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '16px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                position: 'relative',
                background: isActive
                  ? item.gradient
                  : 'transparent',
                color: isActive ? 'white' : '#B0BEC5',
                boxShadow: isActive
                  ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                  : 'none',
                minWidth: '80px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#B0BEC5'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <div style={{
                fontSize: '24px',
                marginBottom: '4px',
                filter: isActive ? 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3))' : 'none'
              }}>
                {item.icon}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? '700' : '500',
                textShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
              }}>
                {item.label}
              </span>

              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '6px',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(255, 255, 255, 0.5)'
                }}></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


