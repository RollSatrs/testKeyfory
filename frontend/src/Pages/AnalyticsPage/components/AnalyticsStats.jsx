import { FaRubleSign, FaShoppingCart, FaChartLine, FaStar } from 'react-icons/fa'

export function AnalyticsStats() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaRubleSign size={18} />
          Общая выручка
        </div>
        <div className="text-2xl font-bold">₽1,347,250</div>
        <div className="text-green-500 text-sm mt-1">+23.5%</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaShoppingCart size={18} />
          Средний чек
        </div>
        <div className="text-2xl font-bold">₽2,450</div>
        <div className="text-green-500 text-sm mt-1">+8.2%</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaChartLine size={18} />
          Конверсия
        </div>
        <div className="text-2xl font-bold">94.2%</div>
        <div className="text-green-500 text-sm mt-1">+2.1%</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaStar size={18} />
          Рейтинг сервиса
        </div>
        <div className="text-2xl font-bold">4.8</div>
        <div className="text-green-500 text-sm mt-1">+0.3</div>
      </div>
    </div>
  )
}