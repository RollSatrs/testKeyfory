import { FiFilter, FiClock } from 'react-icons/fi'

export function AnalyticsHeader() {
  return (
    <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Аналитика и статистика</h1>
        <div className="text-gray-500 text-sm mt-1">Детальная аналитика работы платформы KEYFORY</div>
      </div>
      <div className="flex gap-2 items-center">
        <button className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-200">
          <FiClock size={18} />
          Последние 30 дней
        </button>
        <button className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-200">
          <FiFilter size={18} />
          Фильтры
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition">
          Экспорт
        </button>
      </div>
    </div>
  )
}