import { MdPeople, MdOutlinePersonOff, MdBlock } from "react-icons/md";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export function ExecutorsStats({ refresh }) {
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    blocked: 0,
  });

  async function fetchStats() {
    try {
      console.log(`📊 Запрашиваем статистику исполнителей...`);
      const data = await apiFetch("/api/admin/executers/stats", {
        method: "GET",
      });
      console.log(`📊 Получена статистика:`, data);

      setStats({
        active: data.active || 0,
        inactive: data.inactive || 0,
        blocked: data.blocked || 0,
      });
    } catch (e) {
      console.error("❌ Ошибка при получении статистики:", e);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [refresh]);

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      {/* Активные */}
      <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
        <span className="bg-green-500 text-white rounded p-1.5">
          <MdPeople size={16} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 font-medium">Активных:</span>
          <span className="text-lg font-bold text-green-700">
            {stats.active}
          </span>
        </div>
      </div>

      {/* Неактивные */}
      <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
        <span className="bg-orange-400 text-white rounded p-1.5">
          <MdOutlinePersonOff size={16} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-orange-600 font-medium">
            Неактивных:
          </span>
          <span className="text-lg font-bold text-orange-600">
            {stats.inactive}
          </span>
        </div>
      </div>

      {/* Заблокированные */}
      <div className="bg-gradient-to-r from-red-100 to-red-50 rounded-lg shadow-sm px-4 py-3 flex items-center gap-2 hover:shadow-md transition">
        <span className="bg-red-500 text-white rounded p-1.5">
          <MdBlock size={16} />
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
  );
}
