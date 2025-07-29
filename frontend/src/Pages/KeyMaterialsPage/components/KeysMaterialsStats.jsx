import { useEffect, useState } from 'react'
import { MdListAlt } from 'react-icons/md'

const token = localStorage.getItem("admin_token");

export function KeysMaterialsStats({ refresh }) {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    used: 0,
    pending_replace: 0
  });

  async function fetchStats() {
    try {
      const res = await fetch('http://localhost:3000/api/materials/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setStats({
        total: data.total || 0,
        available: data.available || 0,
        used: data.used || 0,
        pending_replace: data.pending_replace || 0
      });
    } catch (e) {
      console.error('Ошибка при получении статистики материалов:', e);
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
          Всего материалов
        </div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Доступно
        </div>
        <div className="text-2xl font-bold text-green-600">{stats.available}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Использовано
        </div>
        <div className="text-2xl font-bold text-red-500">{stats.used}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          На замене
        </div>
        <div className="text-2xl font-bold text-yellow-500">{stats.pending_replace}</div>
      </div>
    </div>
  )
}