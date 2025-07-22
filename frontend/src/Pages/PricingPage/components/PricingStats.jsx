import { FaPercent, FaRubleSign, FaChartLine } from 'react-icons/fa'

export function PricingStats() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="text-gray-500 mb-2">Услуги с ценами</div>
        <div className="text-2xl font-bold">4</div>
        <div className="text-green-500 text-sm mt-1">Активных правил</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="text-gray-500 mb-2">Средняя наценка <FaPercent className="inline ml-1" /></div>
        <div className="text-2xl font-bold">26%</div>
        <div className="text-green-500 text-sm mt-1">Оптимальный уровень</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="text-gray-500 mb-2">Прибыль за услугу <FaRubleSign className="inline ml-1" /></div>
        <div className="text-2xl font-bold">₽487</div>
        <div className="text-green-500 text-sm mt-1">В среднем</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="text-gray-500 mb-2">Динамическое ценообразование <FaChartLine className="inline ml-1" /></div>
        <div className="text-2xl font-bold">1</div>
        <div className="text-blue-500 text-sm mt-1">Услуг с авто-ценой</div>
      </div>
    </div>
  )
}