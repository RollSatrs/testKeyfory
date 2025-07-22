import { FaStar } from 'react-icons/fa'

const performers = [
  { name: 'Иван Петров', orders: 23, rating: 4.9, spec: 'Игровые сервисы' },
  { name: 'Мария Сидорова', orders: 18, rating: 4.8, spec: 'Стриминг' },
  { name: 'Алексей Козлов', orders: 15, rating: 4.7, spec: 'ПО и VPN' },
  { name: 'Анна Воронова', orders: 12, rating: 4.6, spec: 'Подписки' },
]

export function TopPerformers() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-semibold mb-4">Лучшие исполнители</h2>
      <div className="overflow-x-auto bg-white shadow p-5 rounded-4xl">
        <table className="min-w-full">
          <thead>
            <tr className="text-gray-400/50 text-left text-sm">
              <th className="pb-2">Исполнитель</th>
              <th className="pb-2">Заказов</th>
              <th className="pb-2">Рейтинг</th>
              <th className="pb-2">Специализация</th>
            </tr>
          </thead>
          <tbody>
            {performers.map((p, idx) => (
              <tr
                key={idx}
                className={idx !== performers.length - 1 ? "border-b border-gray-200" : ""}
              >
                <td className="py-2">{p.name}</td>
                <td className="py-2">{p.orders}</td>
                <td className="py-2 flex items-center gap-1">
                  <FaStar className="text-yellow-400" size={16} />
                  {p.rating}
                </td>
                <td className="py-2 text-gray-500">{p.spec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}