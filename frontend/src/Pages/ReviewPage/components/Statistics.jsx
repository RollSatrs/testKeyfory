import { useState, useEffect } from "react";
import { MdKey, MdPeople, MdShoppingCart, MdCancel } from "react-icons/md";
import { FaRubleSign } from "react-icons/fa";

export function Statistics({ stats, loading }) {
  // Если stats не переданы, используем значения по умолчанию
  const defaultStats = {
    totalServices: 0,
    totalExecuters: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newServices: 0,
    activeExecuters: 0,
    completedOrdersPercent: 0,
    revenueGrowth: 0,
    cancelledOrders: 0, // ✨ ДОБАВЛЯЕМ ОТМЕНЕННЫЕ ЗАКАЗЫ
  };

  const currentStats = stats || defaultStats;

  // Форматирование числа в валюту
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Форматирование процентов
  const formatPercent = (percent) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="bg-white rounded-4xl shadow p-6 flex flex-col animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-5 gap-4">
      <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
        <span className="text-gray-500 text-sm">Цифровые услуги</span>
        <div className="flex items-center gap-2 mt-2">
          <MdKey className="text-blue-600" size={22} />
          <span className="text-xl font-bold">
            {currentStats.totalServices}
          </span>
        </div>
        <span className="text-green-500 text-xs mt-1">
          +{currentStats.newServices} новые услуги
        </span>
      </div>

      <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
        <span className="text-gray-500 text-sm">Исполнители</span>
        <div className="flex items-center gap-2 mt-2">
          <MdPeople className="text-blue-600" size={22} />
          <span className="text-xl font-bold">
            {currentStats.totalExecuters}
          </span>
        </div>
        <span className="text-green-500 text-xs mt-1">
          +{currentStats.activeExecuters} активных
        </span>
      </div>

      <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
        <span className="text-gray-500 text-sm">Заказы (30 дней)</span>
        <div className="flex items-center gap-2 mt-2">
          <MdShoppingCart className="text-blue-600" size={22} />
          <span className="text-xl font-bold">{currentStats.totalOrders}</span>
        </div>
        <span className="text-green-500 text-xs mt-1">
          {currentStats.completedOrdersPercent}% завершено
        </span>
      </div>

      {/* ✨ НОВАЯ КАРТОЧКА ДЛЯ ОТМЕНЕННЫХ ЗАКАЗОВ */}
      <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
        <span className="text-gray-500 text-sm">Отмененные заказы</span>
        <div className="flex items-center gap-2 mt-2">
          <MdCancel className="text-red-500" size={22} />
          <span className="text-xl font-bold">
            {currentStats.cancelledOrders}
          </span>
        </div>
        <span className="text-red-500 text-xs mt-1">❌ Не выполнены</span>
      </div>

      <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
        <span className="text-gray-500 text-sm">Выручка</span>
        <div className="flex items-center gap-2 mt-2">
          <FaRubleSign className="text-blue-600" size={22} />
          <span className="text-xl font-bold">
            {formatCurrency(currentStats.totalRevenue)}
          </span>
        </div>
        <span
          className={`text-xs mt-1 ${
            currentStats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {formatPercent(currentStats.revenueGrowth)}
        </span>
      </div>
    </div>
  );
}
