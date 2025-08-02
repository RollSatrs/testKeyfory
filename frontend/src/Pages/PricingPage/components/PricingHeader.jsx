import { FiBarChart2, FiTrendingUp } from 'react-icons/fi'
import { FaChartLine } from 'react-icons/fa'

export function PricingHeader() {
  return (
    <div className="flex bg-gradient-to-r from-green-50 to-emerald-100 shadow-lg p-6 rounded-2xl items-center justify-between mb-6 border border-green-200">
      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
          <FaChartLine className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Статистика заработка
          </h1>
          <p className="text-gray-600 mt-1">
            Аналитика доходов и производительности исполнителей
          </p>
        </div>
      </div>
      <div className="flex space-x-3">
        <button className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50 transition border border-gray-200 shadow-sm">
          <FiBarChart2 size={16} />
          Экспорт данных
        </button>
        <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition shadow-lg">
          <FiTrendingUp size={16} />
          Аналитический отчет
        </button>
      </div>
    </div>
  )
}