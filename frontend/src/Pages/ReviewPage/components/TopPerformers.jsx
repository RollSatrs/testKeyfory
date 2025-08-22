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

        const token = localStorage.getItem("admin_token");
        if (!token) {
          console.warn(
            "TopPerformers: no admin_token found, skipping protected requests"
          );
          return;
        }

        // Use server-side aggregated top performers endpoint (real DB counts)
        const performers = await apiFetch(
          "/api/admin/orders/top-performers?take=4"
        );
        // Normalize response shape if needed
        const normalized = Array.isArray(performers)
          ? performers.map((p) => ({
              id: p.executer_id || p.id,
              name: p.name,
              ordersWeek: p.ordersWeek || p.week_count || 0,
              ordersMonth: p.ordersMonth || p.month_count || 0,
              totalOrders: p.totalOrders || p.total_completed || 0,
              rating: p.rating || 0,
            }))
          : [];

        setPerformers(normalized);
      } catch (error) {
        if (error && error.status === 401) {
          console.warn("Не авторизовано. Перенаправление на страницу входа.");
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
              <th className="pb-2">За неделю</th>
              <th className="pb-2">За месяц</th>
              <th className="pb-2">Всего</th>
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
                      {p.ordersWeek}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className="font-semibold text-green-600">
                      {p.ordersMonth}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500 text-sm">
                    всего: {p.totalOrders}
                  </td>
                  <td className="py-2 flex items-center gap-1">
                    <FaStar className="text-yellow-400" size={16} />
                    {p.rating > 0 ? p.rating.toFixed(1) : "Нет рейтинга"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
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
