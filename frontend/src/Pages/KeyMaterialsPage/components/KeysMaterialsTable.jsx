import { FaKey } from 'react-icons/fa'
import { FiEdit, FiTrash2 } from 'react-icons/fi'

const materials = [
  {
    type: 'Ключ',
    service: 'Spotify Premium 3 месяца',
    content: 'SPOT-ABC123-XYZ789',
    status: 'ДОСТУПЕН',
    source: 'API СКЛАДА',
    added: '15.01.2024, 10:00',
    used: '-',
    order: '-',
  },
  {
    type: 'Ключ',
    service: 'Netflix Premium 6 месяцев',
    content: 'NETF-DEF456-QWE321',
    status: 'ИСПОЛЬЗОВАН',
    source: 'РУЧНАЯ ЗАГРУЗКА',
    added: '14.01.2024, 15:30',
    used: '15.01.2024, 11:45',
    order: 'ORD-002',
  },
  {
    type: 'Ключ',
    service: 'Xbox Game Pass Ultimate 1 месяц',
    content: 'XBOX-GH1789-ASD654',
    status: 'ЗАРЕЗЕРВИРОВАН',
    source: 'API СКЛАДА',
    added: '15.01.2024, 09:15',
    used: '-',
    order: 'ORD-003',
  },
]

export function KeysMaterialsTable() {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <table className="min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-gray-500 text-left text-sm">
            <th className="py-3 px-4 font-semibold">Тип</th>
            <th className="py-3 px-4 font-semibold">Услуга</th>
            <th className="py-3 px-4 font-semibold">Содержимое</th>
            <th className="py-3 px-4 font-semibold">Статус</th>
            <th className="py-3 px-4 font-semibold">Источник</th>
            <th className="py-3 px-4 font-semibold">Добавлен</th>
            <th className="py-3 px-4 font-semibold">Использован</th>
            <th className="py-3 px-4 font-semibold">Заказ</th>
            <th className="py-3 px-4 font-semibold">Действия</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, idx) => (
            <tr
              key={idx}
              className={`transition hover:bg-blue-50 ${idx !== materials.length - 1 ? "border-b border-gray-200" : ""}`}
            >
              <td className="py-3 px-4 flex items-center gap-2">
                <FaKey className="text-gray-400" size={16} />
                {m.type}
              </td>
              <td className="py-3 px-4">{m.service}</td>
              <td className="py-3 px-4">
                <span className="bg-gray-50 px-2 py-1 rounded font-mono text-xs text-gray-700">{m.content}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${m.status === 'ДОСТУПЕН'
                    ? 'bg-green-100 text-green-700'
                    : m.status === 'ИСПОЛЬЗОВАН'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                  {m.status}
                </span>
              </td>
              <td className="py-3 px-4">{m.source}</td>
              <td className="py-3 px-4">{m.added}</td>
              <td className="py-3 px-4">{m.used}</td>
              <td className="py-3 px-4">{m.order}</td>
              <td className="py-3 px-4 flex gap-2">
                <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
                  <FiEdit className="text-gray-500" size={16} />
                </button>
                <button className="bg-red-100 p-2 rounded hover:bg-red-200">
                  <FiTrash2 className="text-red-500" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}