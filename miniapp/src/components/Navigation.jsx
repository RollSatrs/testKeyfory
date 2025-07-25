import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Главная'
    },
    {
      path: '/orders',
      icon: '📋',
      label: 'Заказы'
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Профиль'
    }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--tg-theme-secondary-bg-color, #f8f8f8)',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0',
      zIndex: 1000
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
              padding: '8px 15px',
              borderRadius: '12px',
              textDecoration: 'none',
              background: isActive ? 'var(--tg-theme-button-color, #0088cc)' : 'transparent',
              color: isActive ? 'var(--tg-theme-button-text-color, #ffffff)' : 'var(--tg-theme-text-color, #000000)',
              transition: 'all 0.3s ease',
              minWidth: '60px'
            }}
          >
            <div style={{
              fontSize: '20px',
              marginBottom: '4px'
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: isActive ? '600' : '400'
            }}>
              {item.label}
            </div>
          </Link>
        )
      })}
    </nav>
  );
}

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


