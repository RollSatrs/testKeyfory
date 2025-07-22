import { FiEye } from 'react-icons/fi'

const logs = [
  {
    time: '2024-01-15 14:23:45',
    level: 'INFO',
    module: 'orders',
    user: 'СИСТЕМА',
    action: 'Создан новый заказ',
    details: 'Заказ #1234 - Spotify Premium',
    ip: '192.168.1.100',
  },
  {
    time: '2024-01-15 14:22:15',
    level: 'SUCCESS',
    module: 'executors',
    user: '@ivan_keys',
    action: 'Исполнитель вошел в систему',
    details: 'Telegram ID: 123456789',
    ip: '192.168.1.101',
  },
  {
    time: '2024-01-15 14:20:30',
    level: 'WARNING',
    module: 'materials',
    user: 'АДМИН',
    action: 'Низкий остаток ключей',
    details: 'Netflix 4K - осталось 2 ключа',
    ip: '192.168.1.102',
  },
  {
    time: '2024-01-15 14:18:12',
    level: 'ERROR',
    module: 'orders',
    user: '@maria_seller',
    action: 'Ошибка обработки заказа',
    details: 'Заказ #1233 - ключ не найден',
    ip: '192.168.1.102',
  },
]

const levelColors = {
  INFO: 'bg-blue-100 text-blue-700',
  SUCCESS: 'bg-green-100 text-green-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  ERROR: 'bg-red-100 text-red-700',
}

export function SystemLogsTable() {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="font-semibold mb-4">Журнал событий</div>
      <table className="min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-gray-500 text-left text-sm">
            <th className="py-3 px-4 font-semibold">Время</th>
            <th className="py-3 px-4 font-semibold">Уровень</th>
            <th className="py-3 px-4 font-semibold">Модуль</th>
            <th className="py-3 px-4 font-semibold">Пользователь</th>
            <th className="py-3 px-4 font-semibold">Действие</th>
            <th className="py-3 px-4 font-semibold">Детали</th>
            <th className="py-3 px-4 font-semibold">IP</th>
            <th className="py-3 px-4 font-semibold">Действия</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr
              key={idx}
              className={`transition hover:bg-blue-50 ${idx !== logs.length - 1 ? "border-b border-gray-200" : ""}`}
            >
              <td className="py-3 px-4">{log.time}</td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[log.level]}`}>
                  {log.level}
                </span>
              </td>
              <td className="py-3 px-4">{log.module}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700`}>
                  {log.user}
                </span>
              </td>
              <td className="py-3 px-4">{log.action}</td>
              <td className="py-3 px-4">{log.details}</td>
              <td className="py-3 px-4">{log.ip}</td>
              <td className="py-3 px-4">
                <button className="bg-gray-100 p-2 rounded hover:bg-gray-200">
                  <FiEye className="text-gray-500" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}