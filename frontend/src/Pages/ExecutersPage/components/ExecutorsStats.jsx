import { MdPeople, MdOutlinePersonOff, MdBlock } from "react-icons/md";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export function ExecutorsStats({ refresh }) {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    blocked: 0,
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  async function fetchStats() {
    try {
      console.log(`📊 Запрашиваем онлайн статистику исполнителей...`);
      const data = await apiFetch("/api/admin/executers/online-stats", {
        method: "GET",
      });
      console.log(`📊 Получена онлайн статистика:`, data);

      setStats({
        total: data.total || 0,
        online: data.online || 0,
        offline: data.offline || 0,
        blocked: data.blocked || 0,
      });

      setLastUpdate(new Date());
    } catch (e) {
      console.error("❌ Ошибка при получении онлайн статистики:", e);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [refresh]);

  return (
    <div className="mb-6">
      {/* Индикатор последнего обновления */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Статистика исполнителей
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Обновлено: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {/* Всего */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
          <span className="bg-blue-500 text-white rounded p-1.5">
            <MdPeople size={16} />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 font-medium">Всего:</span>
            <span className="text-lg font-bold text-blue-700">
              {stats.total}
            </span>
          </div>
        </div>

        {/* Онлайн */}
        <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
          <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            ●
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 font-medium">Онлайн:</span>
            <span className="text-lg font-bold text-green-700">
              {stats.online}
            </span>
          </div>
        </div>

        {/* Офлайн */}
        <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
          <span className="bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            ●
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-600 font-medium">Офлайн:</span>
            <span className="text-lg font-bold text-orange-600">
              {stats.offline}
            </span>
          </div>
        </div>

        {/* Заблокированные */}
        <div className="bg-gradient-to-r from-red-100 to-red-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
          <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            ●
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600 font-medium">
              Заблокированных:
            </span>
            <span className="text-lg font-bold text-red-600">
              {stats.blocked}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
