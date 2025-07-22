import { FiFilter } from "react-icons/fi";

export function ServicesSearch() {
  return (
    <div className="flex gap-3 items-center bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl px-4 py-3 shadow-md mb-6">
      <input
        type="text"
        placeholder="🔍 Поиск услуги..."
        className="flex-1 px-5 py-2 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 placeholder-gray-400 text-base transition"
      />
      <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl shadow hover:from-blue-600 hover:to-cyan-500 transition font-semibold">
        <FiFilter className="text-white" size={20} />
        Фильтры
      </button>
    </div>
  );
}