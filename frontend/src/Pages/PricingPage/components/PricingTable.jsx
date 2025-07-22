import { FiEdit } from 'react-icons/fi'

const pricing = [
  {
    service: 'Spotify Premium 3 месяца',
    cost: '₽1 200',
    margin: '25%',
    price: '₽1 500',
    type: 'Фиксированная',
    range: '₽1 400 - ₽1 600',
    status: 'АКТИВНО',
  },
  {
    service: 'Netflix Premium 6 месяцев',
    cost: '₽2 400',
    margin: '25%',
    price: '₽3 000',
    type: 'Фиксированная',
    range: '₽2 800 - ₽3 200',
    status: 'АКТИВНО',
  },
]

export function PricingTable() {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <table className="min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-gray-500 text-left text-sm">
            <th className="py-3 px-4 font-semibold">Услуга</th>
            <th className="py-3 px-4 font-semibold">Себестоимость</th>
            <th className="py-3 px-4 font-semibold">Наценка (%)</th>
            <th className="py-3 px-4 font-semibold">Итоговая цена</th>
            <th className="py-3 px-4 font-semibold">Тип ценообразования</th>
            <th className="py-3 px-4 font-semibold">Диапазон цен</th>
            <th className="py-3 px-4 font-semibold">Статус</th>
            <th className="py-3 px-4 font-semibold">Действия</th>
          </tr>
        </thead>
        <tbody>
          {pricing.map((p, idx) => (
            <tr
              key={idx}
              className={`transition hover:bg-blue-50 ${idx !== pricing.length - 1 ? "border-b border-gray-200" : ""}`}
            >
              <td className="py-3 px-4">{p.service}</td>
              <td className="py-3 px-4">{p.cost}</td>
              <td className="py-3 px-4">{p.margin}</td>
              <td className="py-3 px-4 font-semibold text-green-600">{p.price}</td>
              <td className="py-3 px-4">{p.type}</td>
              <td className="py-3 px-4">{p.range}</td>
              <td className="py-3 px-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {p.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
                  <FiEdit className="text-gray-500" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}