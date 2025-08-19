import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { apiFetch } from "../../../lib/api";

export function TopPerformers() {
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        setLoading(true);

        // Получаем всех исполнителей и заказы (через прокси /api и с JWT)
        const [executers, orders] = await Promise.all([
          apiFetch("/api/admin/executers"),
          apiFetch("/api/admin/orders"),
        ]);

        // Подсчитываем количество заказов для каждого исполнителя
        const safeExecuters = Array.isArray(executers) ? executers : [];
        const safeOrders = Array.isArray(orders) ? orders : [];
        const executerStats = safeExecuters.map((executer) => {
          const executerOrders = safeOrders.filter(
            (order) => order.executer_id === executer.id
          );
          const completedOrders = executerOrders.filter(
            (order) => order.status === "completed"
          );

          return {
            id: executer.id,
            name: executer.name || `Исполнитель #${executer.id}`,
            orders: completedOrders.length,
            totalOrders: executerOrders.length,
            rating: executer.rating || 0,
          };
        });

        // Сортируем по количеству выполненных заказов
        const topPerformers = executerStats
          .filter((e) => e.orders > 0) // Только с выполненными заказами
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 4); // Берем топ-4

        setPerformers(topPerformers);
      } catch (error) {
        if (error.status === 401) {
          console.warn("Не авторизовано. Перенаправление на страницу входа.");
          // Ничего не делаем здесь; ProtectedRoute выполнит редирект при ререндере
        } else {
          console.error("Ошибка загрузки топ исполнителей:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold mb-4">Лучшие исполнители</h2>
        <div className="animate-pulse">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex justify-between items-center py-3 border-b border-gray-200"
            >
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-semibold mb-4">Лучшие исполнители</h2>
      <div className="overflow-x-auto bg-white shadow p-5 rounded-4xl">
        <table className="min-w-full">
          <thead>
            <tr className="text-gray-400/50 text-left text-sm">
              <th className="pb-2">Исполнитель</th>
              <th className="pb-2">Заказов выполнено</th>
              <th className="pb-2">Рейтинг</th>
            </tr>
          </thead>
          <tbody>
            {performers.length > 0 ? (
              performers.map((p, idx) => (
                <tr
                  key={p.id}
                  className={
                    idx !== performers.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }
                >
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">
                    <span className="font-semibold text-green-600">
                      {p.orders}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      из {p.totalOrders}
                    </span>
                  </td>
                  <td className="py-2 flex items-center gap-1">
                    <FaStar className="text-yellow-400" size={16} />
                    {p.rating > 0 ? p.rating.toFixed(1) : "Нет рейтинга"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-500">
                  Нет данных о выполненных заказах
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
