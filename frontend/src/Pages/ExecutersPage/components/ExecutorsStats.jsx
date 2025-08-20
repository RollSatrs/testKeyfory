import { MdPeople, MdOutlinePersonOff, MdBlock } from "react-icons/md";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "../../../lib/backendUrl";

const token = localStorage.getItem("admin_token");

export function ExecutorsStats({ refresh }) {
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    blocked: 0,
  });

  async function fetchStats() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/executers/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStats({
        active: data.active || 0,
        inactive: data.inactive || 0,
        blocked: data.blocked || 0,
      });
    } catch (e) {
      console.error("Ошибка при получении статистики:", e);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [refresh]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Активные */}
      <div className="bg-gradient-to-br from-green-100 via-white to-green-50 rounded-2xl shadow-lg p-7 flex flex-col items-center hover:scale-[1.03] transition">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-green-500 text-white rounded-full p-2 shadow">
            <MdPeople size={28} />
          </span>
          <span className="text-lg font-semibold text-green-700">Активных</span>
        </div>
        <div className="text-4xl font-extrabold text-green-700 drop-shadow">
          {stats.active}
        </div>
      </div>
      {/* Неактивные */}
      <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-orange-100 rounded-2xl shadow-lg p-7 flex flex-col items-center hover:scale-[1.03] transition">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-orange-400 text-white rounded-full p-2 shadow">
            <MdOutlinePersonOff size={28} />
          </span>
          <span className="text-lg font-semibold text-orange-700">
            Неактивных
          </span>
        </div>
        <div className="text-4xl font-extrabold text-orange-600 drop-shadow">
          {stats.inactive}
        </div>
      </div>
      {/* Заблокированные */}
      <div className="bg-gradient-to-br from-red-100 via-white to-red-50 rounded-2xl shadow-lg p-7 flex flex-col items-center hover:scale-[1.03] transition">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-red-500 text-white rounded-full p-2 shadow">
            <MdBlock size={28} />
          </span>
          <span className="text-lg font-semibold text-red-700">
            Заблокированных
          </span>
        </div>
        <div className="text-4xl font-extrabold text-red-600 drop-shadow">
          {stats.blocked}
        </div>
      </div>
    </div>
  );
}
