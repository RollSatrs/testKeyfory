import React, { useState, useEffect } from 'react';
import OrdersHeader from './components/OrdersHeader';
import OrdersFilter from './components/OrdersFilter';
import OrdersList from './components/OrdersList';

const OrdersPage = ({ executer }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [executer]);

  useEffect(() => {
    filterOrders();
  }, [orders, activeFilter]);

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
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (activeFilter !== 'all') {
      filtered = orders.filter(order => order.status === activeFilter);
    }

    setFilteredOrders(filtered);
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
      <div className="max-w-md mx-auto space-y-4">
        <OrdersHeader ordersCount={filteredOrders.length} />

        <OrdersFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          orders={orders}
        />

        <OrdersList
          orders={filteredOrders}
          onStatusUpdate={handleStatusUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default OrdersPage;
