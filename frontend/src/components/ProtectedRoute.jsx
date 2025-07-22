import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Токен недействителен, удаляем его
          localStorage.removeItem('admin_token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1e1e2e] to-[#2d2d44]">
        <div className="text-white text-xl">Проверка авторизации...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
