import React, { useState, useEffect } from 'react';
import ProfileHeader from './components/ProfileHeader';
import ProfileStats from './components/ProfileStats';
import ProfileOrders from './components/ProfileOrders';

const ProfilePage = ({ executer, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    completionRate: 0,
    averageRating: 0
  });

  useEffect(() => {
    loadProfileData();
  }, [executer]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/orders/executer/${executer.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || 'admin_token'}`
        }
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);

        // Подсчет статистики
        const totalOrders = ordersData.length;
        const completedOrders = ordersData.filter(o => o.status === 'completed');
        const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.total_sum || 0), 0);
        const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

        setStats({
          totalOrders,
          completedOrders: completedOrders.length,
          totalEarnings,
          completionRate,
          averageRating: executer.rating || 0
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных профиля:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4">
      <div className="max-w-md mx-auto space-y-6">
        <ProfileHeader executer={executer} onLogout={onLogout} />

        <ProfileStats stats={stats} isLoading={isLoading} />

        <ProfileOrders
          orders={orders.filter(o => o.status === 'in_progress')}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
