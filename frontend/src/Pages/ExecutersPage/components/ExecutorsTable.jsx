const executors = [
  { name: 'Алексей Иванов', tg: '@alex_executor', orders: 145, rating: 4.8, status: 'АКТИВЕН' },
  { name: 'Мария Петрова', tg: '@maria_executor', orders: 98, rating: 4.9, status: 'АКТИВЕН' },
  { name: 'Дмитрий Сидоров', tg: '@dmitry_executor', orders: 67, rating: 4.6, status: 'НЕАКТИВЕН' },
]

export function ExecutorsTable() {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <table className="min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-gray-500 text-left text-sm">
            <th className="py-3 px-4 font-semibold">Имя</th>
            <th className="py-3 px-4 font-semibold">Telegram</th>
            <th className="py-3 px-4 font-semibold">Заказов</th>
            <th className="py-3 px-4 font-semibold">Рейтинг</th>
            <th className="py-3 px-4 font-semibold">Статус</th>
          </tr>
        </thead>
        <tbody>
          {executors.map((e, idx) => (
            <tr
              key={idx}
              className={`transition hover:bg-blue-50 ${idx !== executors.length - 1 ? "border-b border-gray-200" : ""}`}
            >
              <td className="py-3 px-4">{e.name}</td>
              <td className="py-3 px-4 text-blue-600 font-mono">{e.tg}</td>
              <td className="py-3 px-4">{e.orders}</td>
              <td className="py-3 px-4 font-semibold">{e.rating}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${e.status === 'АКТИВЕН'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}
                >
                  {e.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}