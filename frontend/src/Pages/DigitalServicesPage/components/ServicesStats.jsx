import { useEffect, useState } from 'react'
import { MdListAlt } from 'react-icons/md'

const token = localStorage.getItem("admin_token");

export function ServicesStats({ refresh }) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  async function fetchStats() {
    try {

      const res = await fetch('http://localhost:3000/api/services/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        inactive: data.inactive || 0
      });
    } catch (e) {
      console.error('Ошибка при получении статистики:', e);
    }
  }
  useEffect(() => {
    fetchStats();
  }, [refresh]); // теперь статистика обновляется при изменении refresh

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Всего услуг
        </div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Активных услуг
        </div>
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdListAlt size={20} />
          Неактивных услуг
        </div>
        <div className="text-2xl font-bold text-yellow-500">{stats.inactive}</div>
      </div>
    </div>
  )
}