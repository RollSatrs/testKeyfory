import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import DashboardStats from './components/DashboardStats';
import QuickActions from './components/QuickActions';
import RecentOrders from './components/RecentOrders';

const DashboardPage = ({ executer }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    loadOrders();
  }, [executer]);

  const loadOrders = async () => {
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
        const stats = {
          total: ordersData.length,
          completed: ordersData.filter(o => o.status === 'completed').length,
          inProgress: ordersData.filter(o => o.status === 'in_progress').length,
          pending: ordersData.filter(o => o.status === 'pending').length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/update/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || 'admin_token'}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadOrders();

        if (window.Telegram && window.Telegram.WebApp) {
          window.Telegram.WebApp.showAlert('Статус заказа обновлен!');
        }
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.showAlert('Ошибка обновления статуса');
      }
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4">
      <div className="max-w-md mx-auto space-y-6">
        <DashboardHeader executer={executer} />

        <DashboardStats stats={stats} isLoading={isLoading} />

        <QuickActions />

        <RecentOrders
          orders={orders.slice(0, 5)}
          onStatusUpdate={handleStatusUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
