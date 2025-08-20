import { useEffect, useState } from "react";
import { MdListAlt } from "react-icons/md";
import { BACKEND_URL } from "../../../lib/backendUrl";

const token = localStorage.getItem("admin_token");

export function OrdersStats({ refresh }) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });

  async function fetchStats() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStats({
        total: data.total || 0,
        pending: data.pending || 0,
        in_progress: data.in_progress || 0,
        completed: data.completed || 0,
        cancelled: data.cancelled || 0,
      });
    } catch (e) {
      console.error("Ошибка при получении статистики заказов:", e);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [refresh]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Всего заказов
        </div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Ожидают
        </div>
        <div className="text-2xl font-bold text-yellow-600">
          {stats.pending}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />В работе
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {stats.in_progress}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Завершено
        </div>
        <div className="text-2xl font-bold text-green-600">
          {stats.completed}
        </div>
      </div>
    </div>
  );
}
