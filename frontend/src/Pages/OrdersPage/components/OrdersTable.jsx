import { FiEye } from 'react-icons/fi'

const orders = [
  {
    id: 'ORD-001',
    service: 'Spotify Premium 3 месяца',
    client: '@user123',
    executor: 'Алексей Иванов',
    sum: '₽1 500',
    status: 'ЗАВЕРШЕН',
    payment: 'ОПЛАЧЕН',
    created: '15.01.2024, 10:30',
    details: 'Завершен: 15.01.2024, 10:35',
  },
  {
    id: 'ORD-002',
    service: 'Netflix Premium 6 месяцев',
    client: '@user456',
    executor: 'Мария Петрова',
    sum: '₽3 000',
    status: 'ВЫПОЛНЯЕТСЯ',
    payment: 'ОПЛАЧЕН',
    created: '15.01.2024, 11:45',
    details: '',
  },
  {
    id: 'ORD-003',
    service: 'Xbox Game Pass Ultimate',
    client: '@user789',
    executor: 'Не назначен',
    sum: '₽699',
    status: 'ОЖИДАЕТ',
    payment: 'ОЖИДАЕТ ОПЛАТЫ',
    created: '15.01.2024, 12:00',
    details: '',
  },
]

export function OrdersTable() {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <table className="min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-gray-500 text-left text-sm">
            <th className="py-3 px-4 font-semibold">ID заказа</th>
            <th className="py-3 px-4 font-semibold">Услуга</th>
            <th className="py-3 px-4 font-semibold">Клиент</th>
            <th className="py-3 px-4 font-semibold">Исполнитель</th>
            <th className="py-3 px-4 font-semibold">Сумма</th>
            <th className="py-3 px-4 font-semibold">Статус заказа</th>
            <th className="py-3 px-4 font-semibold">Оплата</th>
            <th className="py-3 px-4 font-semibold">Создан</th>
            <th className="py-3 px-4 font-semibold">Действия</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr
              key={idx}
              className={`transition hover:bg-blue-50 ${idx !== orders.length - 1 ? "border-b border-gray-200" : ""}`}
            >
              <td className="py-3 px-4">{o.id}</td>
              <td className="py-3 px-4">{o.service}</td>
              <td className="py-3 px-4 text-blue-600 font-mono">{o.client}</td>
              <td className="py-3 px-4">{o.executor}</td>
              <td className="py-3 px-4">{o.sum}</td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${o.status === 'ЗАВЕРШЕН'
                    ? 'bg-green-100 text-green-700'
                    : o.status === 'ВЫПОЛНЯЕТСЯ'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {o.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${o.payment === 'ОПЛАЧЕН'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-yellow-50 text-yellow-700'
                  }`}>
                  {o.payment}
                </span>
              </td>
              <td className="py-3 px-4">
                {o.created}
                {o.details && (
                  <div className="text-xs text-gray-400">{o.details}</div>
                )}
              </td>
              <td className="py-3 px-4">
                <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
                  <FiEye className="text-gray-500" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}